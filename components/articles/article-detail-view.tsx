"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, ExternalLink, User, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { ArticleMarkdown } from "@/components/articles/article-markdown";
import { ArticleOutline } from "@/components/articles/article-outline";
import { findArticleBySlug } from "@/lib/articles";
import { ARTICLE_CATEGORY_NONE } from "@/lib/types";

export function ArticleDetailView({ slug }: { slug: string[] }) {
  const articles = useStore((s) => s.articles);
  const sources = useStore((s) => s.sources);
  const hydrated = useStore((s) => s.hydrated);
  const loading = useStore((s) => s.loading);

  const item = useMemo(() => findArticleBySlug(articles, slug), [articles, slug]);

  if (!hydrated || loading) {
    return <div className="py-12 text-center text-sm text-fg-subtle">加载中…</div>;
  }

  if (!item) {
    return (
      <div className="py-12 text-center text-sm text-fg-muted">
        <div className="mb-3">未找到该文章</div>
        <Link href="/articles" className="underline">返回文章列表</Link>
      </div>
    );
  }

  const src = sources.find((s) => s.id === item.sourceId);
  const repoUrl = src
    ? `${src.url.replace(/\.git$/, "").replace(/\/$/, "")}/blob/${src.branch ?? "HEAD"}/${item.path}`
    : undefined;

  const tagHref = (t: string) =>
    `/articles?category=${encodeURIComponent(ARTICLE_CATEGORY_NONE)}&tag=${encodeURIComponent(t)}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-auto order-2 lg:order-1">
        <div className="rounded-xl border border-border bg-bg-elevated p-2">
          <ArticleOutline body={item.body} />
        </div>
      </aside>

      <article className="min-w-0 order-1 lg:order-2">
        <header className="border-b border-border pb-5 mb-6">
          <div className="flex items-center gap-2 text-xs text-fg-subtle mb-2">
            <Link
              href="/articles"
              className="inline-flex items-center gap-1 hover:text-fg"
            >
              <ArrowLeft className="size-3.5" />
              Articles
            </Link>
            <span>/</span>
            <span className="truncate">{item.path}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{item.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-fg-muted">
            {item.author && (
              <span className="inline-flex items-center gap-1.5">
                <User className="size-4" />
                {item.author}
              </span>
            )}
            {item.datetime && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                {item.datetime}
              </span>
            )}
            <span className="truncate">{item.sourceLabel}</span>
            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 underline hover:text-fg"
              >
                <ExternalLink className="size-3.5" />
                在 GitHub 查看源文件
              </a>
            )}
          </div>
          {item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <Link
                  key={t}
                  href={tagHref(t)}
                  className="inline-flex items-center h-6 px-2 rounded-md text-[11px] bg-bg-subtle border border-border text-fg-muted hover:text-fg hover:border-border-strong"
                >
                  {t}
                </Link>
              ))}
            </div>
          )}
          {item.desc && <p className="mt-4 text-sm text-fg-muted">{item.desc}</p>}
        </header>

        <ArticleMarkdown source={item.body} />

        <footer className="mt-10 pt-6 border-t border-border text-sm text-fg-muted space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {item.author && (
              <span className="inline-flex items-center gap-1.5">
                <User className="size-4" />
                {item.author}
              </span>
            )}
            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 underline hover:text-fg"
              >
                <ExternalLink className="size-3.5" />
                在 GitHub 查看源文件
              </a>
            )}
          </div>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <Link
                  key={t}
                  href={tagHref(t)}
                  className="inline-flex items-center h-6 px-2 rounded-md text-[11px] bg-bg-subtle border border-border text-fg-muted hover:text-fg hover:border-border-strong"
                >
                  {t}
                </Link>
              ))}
            </div>
          )}
        </footer>
      </article>
    </div>
  );
}
