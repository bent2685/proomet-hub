import { ARTICLE_CATEGORY_NONE, type ArticleItem } from "@/lib/types";

export type Heading = { level: number; text: string; slug: string };

export function slugify(text: string, seen?: Map<string, number>): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[`~!@#$%^&*()+=<>?:"{}|,.\/;'[\]\\·！￥…（）—【】、；：""''，。《》？]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const s = base || "section";
  if (!seen) return s;
  const n = seen.get(s) ?? 0;
  seen.set(s, n + 1);
  return n === 0 ? s : `${s}-${n}`;
}

export function stripInlineMd(text: string): string {
  return text
    .replace(/`+/g, "")
    .replace(/\*+/g, "")
    .replace(/_+/g, "")
    .replace(/~+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractHeadings(body: string): Heading[] {
  const lines = body.split("\n");
  const out: Heading[] = [];
  const seen = new Map<string, number>();
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const level = m[1].length;
    const text = stripInlineMd(m[2]);
    out.push({ level, text, slug: slugify(text, seen) });
  }
  return out;
}

export type CategoryNode = {
  name: string;
  key: string;
  count: number;
  children: CategoryNode[];
};

export function buildCategoryTree(articles: ArticleItem[]): {
  root: CategoryNode;
  none: CategoryNode;
  categories: CategoryNode[];
} {
  const root: CategoryNode = { name: "全部", key: "", count: articles.length, children: [] };
  const none: CategoryNode = {
    name: "默认（无分类）",
    key: ARTICLE_CATEGORY_NONE,
    count: 0,
    children: [],
  };

  const map = new Map<string, CategoryNode>();

  for (const a of articles) {
    if (a.category.length === 0) {
      none.count += 1;
      continue;
    }
    let parentChildren = root.children;
    let prefix = "";
    for (let i = 0; i < a.category.length; i++) {
      const seg = a.category[i];
      prefix = prefix ? `${prefix}/${seg}` : seg;
      let node = map.get(prefix);
      if (!node) {
        node = { name: seg, key: prefix, count: 0, children: [] };
        map.set(prefix, node);
        parentChildren.push(node);
      }
      node.count += 1;
      parentChildren = node.children;
    }
  }

  const sortRec = (n: CategoryNode) => {
    n.children.sort((a, b) => a.name.localeCompare(b.name));
    n.children.forEach(sortRec);
  };
  sortRec(root);

  return { root, none, categories: root.children };
}

export function articleSlugParts(a: ArticleItem): string[] {
  // /articles/{sourceId}/{...category}/{filename-no-ext}
  const rel = a.path.replace(/^hub_posts\//, "").replace(/\.md$/i, "");
  return [a.sourceId, ...rel.split("/")];
}

export function articleHref(a: ArticleItem): string {
  return "/articles/" + articleSlugParts(a).map(encodeURIComponent).join("/");
}

export function findArticleBySlug(articles: ArticleItem[], slug: string[]): ArticleItem | null {
  if (slug.length < 2) return null;
  const decoded = slug.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
  const [sourceId, ...rest] = decoded;
  const relNoExt = rest.join("/");
  const path = `hub_posts/${relNoExt}.md`;
  return articles.find((a) => a.sourceId === sourceId && a.path === path) ?? null;
}

export function articleMatchesCategory(a: ArticleItem, categoryKey: string | null): boolean {
  if (!categoryKey) return true;
  if (categoryKey === ARTICLE_CATEGORY_NONE) return a.category.length === 0;
  const prefix = categoryKey + "/";
  return a.categoryKey === categoryKey || a.categoryKey.startsWith(prefix);
}
