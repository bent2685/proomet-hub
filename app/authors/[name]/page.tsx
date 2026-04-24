"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PromptCard } from "@/components/prompt-card";
import { PromptDetail } from "@/components/prompt-detail";
import { ArticleCard } from "@/components/articles/article-card";

export default function AuthorPage({ params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name);
  const items = useStore((s) => s.items);
  const articles = useStore((s) => s.articles);
  const promptList = useMemo(() => items.filter((it) => it.author === name), [items, name]);
  const articleList = useMemo(
    () => articles.filter((a) => a.author === name),
    [articles, name],
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = openId ? promptList.find((i) => i.id === openId) ?? null : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">@{name}</h1>
        <div className="text-sm text-fg-muted mt-1">
          {promptList.length} prompts
          {articleList.length > 0 && ` · ${articleList.length} articles`}
        </div>
      </div>

      {promptList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Prompts</h2>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {promptList.map((it) => (
              <PromptCard key={it.id} item={it} onOpen={setOpenId} />
            ))}
          </div>
        </section>
      )}

      {articleList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Articles</h2>
          <div className="flex flex-col gap-3">
            {articleList.map((a) => (
              <ArticleCard key={a.id} item={a} />
            ))}
          </div>
        </section>
      )}

      <PromptDetail item={openItem} onClose={() => setOpenId(null)} />
    </div>
  );
}
