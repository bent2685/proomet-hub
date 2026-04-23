import matter from "gray-matter";
import { UNCATEGORIZED_TAG, type FrontMatter, type PromptItem, type Source } from "@/lib/types";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/cache";

export async function invalidateCache(prefix?: string) {
  await cacheInvalidate(prefix);
}

export type Host = "github" | "gitee";

export function parseRepoUrl(url: string): {
  host: Host;
  owner: string;
  repo: string;
  branch?: string;
  subdir?: string;
} | null {
  try {
    const u = new URL(url);
    const host: Host = u.hostname.includes("gitee") ? "gitee" : "github";
    const parts = u.pathname.replace(/^\/+/, "").replace(/\.git$/, "").split("/");
    if (parts.length < 2) return null;
    const [owner, repo, ...rest] = parts;
    let branch: string | undefined;
    let subdir: string | undefined;
    if (rest[0] === "tree" && rest[1]) {
      branch = rest[1];
      if (rest.length > 2) subdir = rest.slice(2).join("/");
    }
    return { host, owner, repo, branch, subdir };
  } catch {
    return null;
  }
}

type Tokens = { github?: string; gitee?: string };

function authHeaders(host: Host, tokens: Tokens): HeadersInit {
  const h: Record<string, string> = { "user-agent": "proomet-hub" };
  if (host === "github") {
    h.accept = "application/vnd.github+json";
    if (tokens.github) h.authorization = `Bearer ${tokens.github}`;
  } else {
    h.accept = "application/json";
  }
  return h;
}

type TreeFile = { path: string; sha?: string };

async function tryListMdFiles(
  host: Host,
  owner: string,
  repo: string,
  branch: string,
  tokens: Tokens,
): Promise<{ ok: true; files: TreeFile[] } | { ok: false; status: number }> {
  const url =
    host === "github"
      ? `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
      : `https://gitee.com/api/v5/repos/${owner}/${repo}/git/trees/${branch}?recursive=1${tokens.gitee ? `&access_token=${tokens.gitee}` : ""}`;
  const res = await fetch(url, { headers: authHeaders(host, tokens) });
  if (!res.ok) return { ok: false, status: res.status };
  const json = (await res.json()) as { tree?: { path: string; type: string; sha: string }[] };
  const files = (json.tree ?? [])
    .filter((n) => n.type === "blob" && n.path.toLowerCase().endsWith(".md"))
    .map((n) => ({ path: n.path, sha: n.sha }));
  return { ok: true, files };
}

async function listMdFilesAndBranch(
  host: Host,
  owner: string,
  repo: string,
  preferred: string | undefined,
  tokens: Tokens,
): Promise<{ files: TreeFile[]; branch: string }> {
  const candidates = [preferred, "main", "master"].filter(
    (b, i, arr): b is string => !!b && arr.indexOf(b) === i,
  );
  let lastStatus = 0;
  for (const branch of candidates) {
    const r = await tryListMdFiles(host, owner, repo, branch, tokens);
    if (r.ok) return { files: r.files, branch };
    lastStatus = r.status;
    if (r.status === 403 || r.status === 401) {
      throw new Error(
        `GitHub/Gitee API 限流或鉴权失败 (${r.status})。请到设置页配置 PAT Token。`,
      );
    }
    if (r.status !== 404) throw new Error(`tree ${r.status}`);
  }
  throw new Error(`tree ${lastStatus || 404}：仓库不存在或默认分支不是 main/master。`);
}

async function fetchRaw(
  host: Host,
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  tokens: Tokens,
): Promise<string> {
  if (host === "github") {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    const res = await fetch(rawUrl, {
      headers: tokens.github ? { authorization: `Bearer ${tokens.github}` } : undefined,
    });
    if (!res.ok) throw new Error(`raw ${res.status}`);
    return res.text();
  }
  const url = `https://gitee.com/api/v5/repos/${owner}/${repo}/raw/${encodeURIComponent(filePath)}?ref=${branch}${tokens.gitee ? `&access_token=${tokens.gitee}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`raw ${res.status}`);
  return res.text();
}

function normalizeTags(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((t) => (typeof t === "string" ? t : typeof t === "number" ? String(t) : ""))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof input === "string") {
    return input.split(/[,，、\/|\s]+/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function pickString(fm: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = fm[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickTags(fm: Record<string, unknown>): string[] {
  for (const k of ["tags", "tag", "keywords", "keyword", "labels", "label"]) {
    const v = fm[k];
    if (v !== undefined && v !== null) {
      const arr = normalizeTags(v);
      if (arr.length) return arr;
    }
  }
  return [];
}

function fileNameTitle(filePath: string): string {
  const base = filePath.split("/").pop() ?? filePath;
  return base.replace(/\.md$/i, "");
}

function parseMd(raw: string, filePath: string) {
  try {
    const parsed = matter(raw);
    const fm = (parsed.data ?? {}) as Record<string, unknown>;
    const tags = pickTags(fm);
    const title = pickString(fm, ["title", "name"]) ?? fileNameTitle(filePath);
    const author = pickString(fm, ["author", "by", "creator", "owner"]);
    const desc = pickString(fm, ["desc", "description", "summary", "intro", "introduction"]);
    return {
      meta: fm as FrontMatter,
      title,
      tags: tags.length ? tags : [UNCATEGORIZED_TAG],
      author,
      desc,
      body: parsed.content.trimStart(),
      hadFrontmatter: tags.length > 0 || !!author || !!desc || !!pickString(fm, ["title", "name"]),
    };
  } catch {
    return {
      meta: {},
      title: fileNameTitle(filePath),
      tags: [UNCATEGORIZED_TAG],
      author: undefined,
      desc: undefined,
      body: raw,
      hadFrontmatter: false,
    };
  }
}

export type FetchSourceResult = { items: PromptItem[]; readme?: string };

function isRootReadme(filePath: string, rootDir: string): boolean {
  const prefix = rootDir ? `${rootDir}/` : "";
  const rel = filePath.startsWith(prefix) ? filePath.slice(prefix.length) : filePath;
  return /^readme\.md$/i.test(rel);
}

export async function fetchSource(source: Source, tokens: Tokens): Promise<FetchSourceResult> {
  const parsed = parseRepoUrl(source.url);
  if (!parsed) return { items: [] };
  const { host, owner, repo } = parsed;
  const preferred = source.branch ?? parsed.branch;
  const subdir = (source.subdir ?? parsed.subdir ?? "").replace(/^\/+|\/+$/g, "");

  const cacheKey = `src:v4:${source.id}:${preferred ?? ""}:${subdir}`;
  const cached = await cacheGet<FetchSourceResult>(cacheKey);
  if (cached && Array.isArray(cached.items)) return cached;

  const { files, branch } = await listMdFilesAndBranch(host, owner, repo, preferred, tokens);
  const scoped = subdir ? files.filter((f) => f.path.startsWith(subdir + "/") || f.path === subdir) : files;

  const readmeFile = scoped.find((f) => isRootReadme(f.path, subdir));
  const promptFiles = scoped.filter((f) => !isRootReadme(f.path, subdir));

  const label = source.label ?? `${owner}/${repo}`;

  const fetchOne = async (f: TreeFile): Promise<PromptItem | null> => {
    try {
      const raw = await fetchRaw(host, owner, repo, branch, f.path, tokens);
      const parsed = parseMd(raw, f.path);
      return {
        id: `${source.id}:${f.path}`,
        sourceId: source.id,
        sourceLabel: label,
        path: f.path,
        title: parsed.title,
        tags: parsed.tags,
        author: parsed.author,
        desc: parsed.desc,
        meta: parsed.meta,
        body: parsed.body,
        sha: f.sha,
      };
    } catch {
      return null;
    }
  };

  const [rawItems, readme] = await Promise.all([
    Promise.all(promptFiles.map(fetchOne)),
    readmeFile
      ? fetchRaw(host, owner, repo, branch, readmeFile.path, tokens).catch(() => undefined)
      : Promise.resolve(undefined),
  ]);

  const items: PromptItem[] = [];
  for (const it of rawItems) if (it) items.push(it);

  const result: FetchSourceResult = { items, readme };
  await cacheSet(cacheKey, result);
  return result;
}

export async function fetchAllSources(
  sources: Source[],
  tokens: Tokens,
): Promise<{ items: PromptItem[]; readmes: Record<string, string>; errors: Record<string, string> }> {
  const results = await Promise.all(
    sources.map((s) =>
      fetchSource(s, tokens)
        .then((r) => ({ r, error: undefined as string | undefined }))
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[prompts] fetchSource failed", s.url, msg);
          return { r: { items: [] as PromptItem[] } as FetchSourceResult, error: msg };
        }),
    ),
  );
  const items = results.flatMap(({ r }) => (Array.isArray(r?.items) ? r.items : []));
  const readmes: Record<string, string> = {};
  const errors: Record<string, string> = {};
  results.forEach(({ r, error }, i) => {
    if (r?.readme) readmes[sources[i].id] = r.readme;
    if (error) errors[sources[i].id] = error;
  });
  return { items, readmes, errors };
}
