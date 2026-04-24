"use client";

import Link from "next/link";
import { User, FolderTree, Clock } from "lucide-react";
import type { ArticleItem } from "@/lib/types";
import { articleHref } from "@/lib/articles";

export function ArticleCard({ item }: { item: ArticleItem }) {
  return (
    <Link
      href={articleHref(item)}
      className="block rounded-xl border border-border hover:border-border-strong bg-bg-elevated hover:bg-bg-subtle p-4 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium tracking-tight text-[15px] line-clamp-1">{item.title}</h3>
        <span className="shrink-0 text-[11px] text-fg-subtle truncate max-w-[40%]">
          {item.sourceLabel}
        </span>
      </div>
      {item.desc && (
        <p className="mt-1.5 text-[13px] text-fg-muted line-clamp-2 leading-relaxed">
          {item.desc}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fg-subtle">
        {item.author && (
          <span className="inline-flex items-center gap-1">
            <User className="size-3" />
            {item.author}
          </span>
        )}
        {item.category.length > 0 && (
          <span className="inline-flex items-center gap-1 min-w-0">
            <FolderTree className="size-3" />
            <span className="truncate">{item.category.join(" / ")}</span>
          </span>
        )}
        {item.datetime && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {item.datetime}
          </span>
        )}
      </div>
      {item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {item.tags.slice(0, 6).map((t) => (
            <span
              key={t}
              className="inline-flex items-center h-5 px-1.5 rounded-md text-[10px] bg-bg-subtle border border-border text-fg-muted"
            >
              {t}
            </span>
          ))}
          {item.tags.length > 6 && (
            <span className="text-[10px] text-fg-subtle self-center">
              +{item.tags.length - 6}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
