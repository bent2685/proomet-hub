import matter from "gray-matter";
import { UNCATEGORIZED_TAG, type FrontMatter, type PromptItem, type Source } from "@/lib/types";

const TTL = 10 * 60 * 1000;
type CacheEntry<T> = { at: number; data: T };
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL) {
    cache.delete(key);
    return null;
  }
  return hit.data as T;
}
function setCached<T>(key: string, data: T) {
  cache.set(key, { at: Date.now(), data });
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const k of cache.keys()) if (k.startsWith(prefix)) cache.delete(k);
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

async function getDefaultBranch(host: Host, owner: string, repo: string, tokens: Tokens): Promise<string> {
  const url =
    host === "github"
      ? `https://api.github.com/repos/${owner}/${repo}`
      : `https://gitee.com/api/v5/repos/${owner}/${repo}${tokens.gitee ? `?access_token=${tokens.gitee}` : ""}`;
  const res = await fetch(url, { headers: authHeaders(host, tokens) });
  if (!res.ok) throw new Error(`repo meta ${res.status}`);
  const json = (await res.json()) as { default_branch?: string; default_branch_name?: string };
  return json.default_branch ?? json.default_branch_name ?? "main";
}

type TreeFile = { path: string; sha?: string };

async function listMdFiles(
  host: Host,
  owner: string,
  repo: string,
  branch: string,
  tokens: Tokens,
): Promise<TreeFile[]> {
  if (host === "github") {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const res = await fetch(url, { headers: authHeaders(host, tokens) });
    if (!res.ok) throw new Error(`tree ${res.status}`);
    const json = (await res.json()) as {
      tree: { path: string; type: string; sha: string }[];
    };
    return json.tree
      .filter((n) => n.type === "blob" && n.path.toLowerCase().endsWith(".md"))
      .map((n) => ({ path: n.path, sha: n.sha }));
  }
  // Gitee: recurse via /repos/:owner/:repo/git/gitee/trees/:sha?recursive=1
  const url = `https://gitee.com/api/v5/repos/${owner}/${repo}/git/trees/${branch}?recursive=1${tokens.gitee ? `&access_token=${tokens.gitee}` : ""}`;
  const res = await fetch(url, { headers: authHeaders(host, tokens) });
  if (!res.ok) throw new Error(`tree ${res.status}`);
  const json = (await res.json()) as { tree: { path: string; type: string; sha: string }[] };
  return json.tree
    .filter((n) => n.type === "blob" && n.path.toLowerCase().endsWith(".md"))
    .map((n) => ({ path: n.path, sha: n.sha }));
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
  if (Array.isArray(input)) return input.filter((t): t is string => typeof t === "string").map((s) => s.trim()).filter(Boolean);
  if (typeof input === "string") return input.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function fileNameTitle(filePath: string): string {
  const base = filePath.split("/").pop() ?? filePath;
  return base.replace(/\.md$/i, "");
}

function parseMd(raw: string, filePath: string) {
  try {
    const parsed = matter(raw);
    const fm = (parsed.data ?? {}) as FrontMatter;
    const tags = normalizeTags(fm.tags);
    return {
      meta: fm,
      title: (typeof fm.title === "string" && fm.title) || fileNameTitle(filePath),
      tags: tags.length ? tags : [UNCATEGORIZED_TAG],
      author: typeof fm.author === "string" ? fm.author : undefined,
      desc: typeof fm.desc === "string" ? fm.desc : undefined,
      body: parsed.content.trimStart(),
      hadFrontmatter: tags.length > 0 || !!fm.author || !!fm.desc || !!fm.title,
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
  const branch = source.branch ?? parsed.branch ?? (await getDefaultBranch(host, owner, repo, tokens));
  const subdir = (source.subdir ?? parsed.subdir ?? "").replace(/^\/+|\/+$/g, "");

  const cacheKey = `src:${source.id}:${branch}:${subdir}`;
  const cached = getCached<FetchSourceResult>(cacheKey);
  if (cached) return cached;

  const files = await listMdFiles(host, owner, repo, branch, tokens);
  const scoped = subdir ? files.filter((f) => f.path.startsWith(subdir + "/") || f.path === subdir) : files;

  const readmeFile = scoped.find((f) => isRootReadme(f.path, subdir));
  const promptFiles = scoped.filter((f) => !isRootReadme(f.path, subdir));

  const label = source.label ?? `${owner}/${repo}`;

  const [items, readme] = await Promise.all([
    Promise.all(
      promptFiles.map(async (f) => {
        try {
          const raw = await fetchRaw(host, owner, repo, branch, f.path, tokens);
          const parsed = parseMd(raw, f.path);
          const id = `${source.id}:${f.path}`;
          return {
            id,
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
          } satisfies PromptItem;
        } catch {
          return null;
        }
      }),
    ),
    readmeFile
      ? fetchRaw(host, owner, repo, branch, readmeFile.path, tokens).catch(() => undefined)
      : Promise.resolve(undefined),
  ]);

  const result: FetchSourceResult = {
    items: items.filter((x): x is PromptItem => !!x),
    readme,
  };
  setCached(cacheKey, result);
  return result;
}

export async function fetchAllSources(
  sources: Source[],
  tokens: Tokens,
): Promise<{ items: PromptItem[]; readmes: Record<string, string> }> {
  const results = await Promise.all(
    sources.map((s) =>
      fetchSource(s, tokens).catch(() => ({ items: [] as PromptItem[] }) as FetchSourceResult),
    ),
  );
  const items = results.flatMap((r) => r.items);
  const readmes: Record<string, string> = {};
  results.forEach((r, i) => {
    if (r.readme) readmes[sources[i].id] = r.readme;
  });
  return { items, readmes };
}
