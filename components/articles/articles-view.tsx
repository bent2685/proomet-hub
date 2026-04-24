"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, User, ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { TagCloud } from "@/components/tag-cloud";
import { CategoryTree } from "@/components/articles/category-tree";
import { ArticleCard } from "@/components/articles/article-card";
import { articleMatchesCategory, buildCategoryTree } from "@/lib/articles";
import { ARTICLE_CATEGORY_NONE } from "@/lib/types";

const PAGE_SIZE = 20;

export function ArticlesView() {
  const articles = useStore((s) => s.articles);
  const sources = useStore((s) => s.sources);
  const loading = useStore((s) => s.loading);
  const hydrated = useStore((s) => s.hydrated);
  const reload = useStore((s) => s.reloadPrompts);

  const router = useRouter();
  const sp = useSearchParams();

  const category = sp.get("category"); // null | __none__ | "a/b"
  const tag = sp.get("tag");
  const author = sp.get("author");
  const q = sp.get("q") ?? "";
  const sort = (sp.get("sort") ?? "none") as "none" | "desc" | "asc";

  const [query, setQuery] = useState(q);
  useEffect(() => setQuery(q), [q]);

  const tree = useMemo(() => buildCategoryTree(articles), [articles]);

  const categoryFiltered = useMemo(
    () => articles.filter((a) => articleMatchesCategory(a, category)),
    [articles, category],
  );

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of categoryFiltered) for (const t of a.tags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [categoryFiltered]);

  const authorCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of categoryFiltered) {
      if (a.author) m.set(a.author, (m.get(a.author) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [categoryFiltered]);

  const filtered = useMemo(() => {
    const ql = query.trim().toLowerCase();
    const list = categoryFiltered.filter((a) => {
      if (tag && !a.tags.includes(tag)) return false;
      if (author && a.author !== author) return false;
      if (ql) {
        const hay = `${a.title} ${a.desc ?? ""} ${a.author ?? ""} ${a.tags.join(" ")} ${a.body.slice(0, 800)}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
    if (sort === "none") return list;
    const dir = sort === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = a.datetimeMs;
      const bv = b.datetimeMs;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av - bv) * dir;
    });
  }, [categoryFiltered, tag, author, query, sort]);

  const [visible, setVisible] = useState(PAGE_SIZE);
  useEffect(() => setVisible(PAGE_SIZE), [category, tag, author, query, sort, articles.length]);

  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
          }
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [filtered.length]);

  function setParam(next: Record<string, string | null | undefined>) {
    const params = new URLSearchParams(Array.from(sp.entries()));
    for (const [k, v] of Object.entries(next)) {
      if (v == null || v === "") params.delete(k);
      else params.set(k, v);
    }
    const s = params.toString();
    router.push(`/articles${s ? `?${s}` : ""}`, { scroll: false });
  }

  function selectCategory(key: string | null) {
    setParam({ category: key ?? null, tag: null });
  }

  function toggleTag(t: string) {
    setParam({ tag: tag === t ? null : t });
  }
  function clearTag() {
    setParam({ tag: null });
  }

  function toggleAuthor(a: string) {
    setParam({ author: author === a ? null : a });
  }

  function submitQuery(e: React.FormEvent) {
    e.preventDefault();
    setParam({ q: query || null });
  }

  const selectedTagSet = useMemo(() => new Set(tag ? [tag] : []), [tag]);
  const shown = filtered.slice(0, visible);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
        <div className="rounded-xl border border-border bg-bg-elevated p-2">
          <CategoryTree
            root={tree.root}
            none={tree.none}
            selected={category}
            onSelect={selectCategory}
          />
        </div>
      </aside>

      <div className="space-y-5 min-w-0">
        {hydrated && sources.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-fg-muted">
            还没有配置 Source，去 <a href="/sources" className="underline">Sources</a> 添加。
          </div>
        )}

        {hydrated && sources.length > 0 && articles.length === 0 && !loading && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-fg-muted">
            当前 Source 下没有文章。在仓库根目录创建 <code>hub_posts/</code> 并放入 md 文件即可。
          </div>
        )}

        <form onSubmit={submitQuery} className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={submitQuery}
            placeholder="搜索文章标题 / 描述 / tag / 作者 / 内容…"
            className="flex-1 h-10 px-3 rounded-md bg-bg-elevated border border-border focus:border-border-strong outline-none text-sm"
          />
          <button
            type="button"
            onClick={() => {
              const next = sort === "none" ? "desc" : sort === "desc" ? "asc" : "none";
              setParam({ sort: next === "none" ? null : next });
            }}
            title="按发布时间排序（frontmatter datetime）"
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-md border border-border hover:border-border-strong bg-bg-elevated text-sm"
          >
            {sort === "asc" ? (
              <ArrowUpWideNarrow className="size-4" />
            ) : (
              <ArrowDownWideNarrow className="size-4" />
            )}
            {sort === "none" ? "时间" : sort === "desc" ? "新→旧" : "旧→新"}
          </button>
          <button
            type="button"
            onClick={() => reload({ refresh: true })}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-md border border-border hover:border-border-strong bg-bg-elevated text-sm disabled:opacity-50"
          >
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
            强制刷新
          </button>
        </form>

        {authorCounts.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[11px] text-fg-subtle inline-flex items-center gap-1">
              <User className="size-3" />
              作者
            </span>
            <button
              onClick={() => setParam({ author: null })}
              className={clsx(
                "h-7 px-3 rounded-full text-xs border",
                !author
                  ? "bg-accent text-accent-foreground border-accent"
                  : "border-border hover:border-border-strong text-fg-muted",
              )}
            >
              All
            </button>
            {authorCounts.map(([name, n]) => {
              const active = author === name;
              return (
                <button
                  key={name}
                  onClick={() => toggleAuthor(name)}
                  className={clsx(
                    "h-7 px-3 rounded-full text-xs border",
                    active
                      ? "bg-accent text-accent-foreground border-accent"
                      : "border-border hover:border-border-strong bg-bg-elevated",
                  )}
                >
                  <span className="mr-1">{name}</span>
                  <span className="text-[10px] opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
        )}

        {tagCounts.length > 0 && (
          <TagCloud
            tagCounts={tagCounts}
            selected={selectedTagSet}
            onToggle={toggleTag}
            onClear={clearTag}
          />
        )}

        <div className="flex flex-col gap-3">
          {shown.map((a) => (
            <ArticleCard key={a.id} item={a} />
          ))}
        </div>

        {filtered.length === 0 && articles.length > 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-fg-muted">
            没有匹配的文章
          </div>
        )}

        {visible < filtered.length && (
          <div ref={sentinel} className="h-10 grid place-items-center text-xs text-fg-subtle">
            加载中…
          </div>
        )}
      </div>
    </div>
  );
}
