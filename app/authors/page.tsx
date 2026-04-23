"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { User } from "lucide-react";

export default function AuthorsPage() {
  const items = useStore((s) => s.items);
  const authors = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) if (it.author) map.set(it.author, (map.get(it.author) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Authors</h1>
      {authors.length === 0 ? (
        <p className="text-sm text-fg-muted">暂无作者信息。</p>
      ) : (
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map(([a, n]) => (
            <Link
              key={a}
              href={`/authors/${encodeURIComponent(a)}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-border-strong bg-bg-elevated"
            >
              <div className="size-8 grid place-items-center rounded-full bg-bg-subtle border border-border">
                <User className="size-4 text-fg-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{a}</div>
                <div className="text-xs text-fg-subtle">{n} prompts</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
