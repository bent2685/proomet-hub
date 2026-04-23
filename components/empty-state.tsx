"use client";

import Link from "next/link";
import { Github, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useState } from "react";

const SUGGESTIONS = [
  { label: "Prompt Engineering Guide", url: "https://github.com/dair-ai/Prompt-Engineering-Guide" },
  { label: "Awesome Prompt Engineering", url: "https://github.com/promptslab/Awesome-Prompt-Engineering" },
];

export function EmptyState() {
  const add = useStore((s) => s.addSource);
  const [pending, setPending] = useState<string | null>(null);

  async function quickAdd(url: string, label: string) {
    setPending(url);
    await add(url, label);
    setPending(null);
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-bg-elevated p-10 text-center">
      <div className="mx-auto size-12 grid place-items-center rounded-lg bg-bg-subtle border border-border mb-4">
        <Github className="size-5" />
      </div>
      <h2 className="text-lg font-medium">还没有源仓库</h2>
      <p className="mt-1 text-sm text-fg-muted">添加一个包含 markdown prompt 的 git 仓库即可开始浏览。</p>
      <div className="mt-5 flex flex-wrap gap-2 justify-center">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.url}
            onClick={() => quickAdd(s.url, s.label)}
            disabled={pending === s.url}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border hover:border-border-strong bg-bg text-sm disabled:opacity-50"
          >
            <Plus className="size-4" />
            {pending === s.url ? "添加中…" : s.label}
          </button>
        ))}
        <Link
          href="/sources"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-accent text-accent-foreground text-sm hover:opacity-90"
        >
          管理源
        </Link>
      </div>
    </div>
  );
}
