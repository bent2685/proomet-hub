"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Trash2, RefreshCw, Plus, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { Markdown } from "@/components/markdown";
import clsx from "clsx";

export default function SourcesPage() {
  const sources = useStore((s) => s.sources);
  const add = useStore((s) => s.addSource);
  const remove = useStore((s) => s.removeSource);
  const reload = useStore((s) => s.reloadPrompts);
  const items = useStore((s) => s.items);
  const readmes = useStore((s) => s.readmes);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    const res = await add(url, label || undefined);
    setPending(false);
    if (!res.ok) setErr(res.error ?? "添加失败");
    else {
      setUrl("");
      setLabel("");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
        <p className="text-sm text-fg-muted mt-1">
          管理 prompt 来源 git 仓库。仓库根目录的 <code>README.md</code> 不会进入 prompt 列表，只在此处展示。
        </p>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-border bg-bg-elevated p-4 flex flex-col md:flex-row gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="flex-1 h-10 px-3 rounded-md bg-bg border border-border focus:border-border-strong outline-none text-sm"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="自定义显示名 (可选)"
          className="md:w-60 h-10 px-3 rounded-md bg-bg border border-border focus:border-border-strong outline-none text-sm"
        />
        <button
          disabled={pending}
          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="size-4" />
          {pending ? "添加中…" : "添加"}
        </button>
      </form>
      {err && <div className="text-sm text-red-400">{err}</div>}

      <div className="flex items-center justify-between">
        <h2 className="text-sm text-fg-muted">{sources.length} 个源 · {items.length} 个 prompt</h2>
        <button
          onClick={() => reload({ refresh: true })}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border hover:border-border-strong text-xs"
        >
          <RefreshCw className="size-3.5" />
          刷新
        </button>
      </div>

      <ul className="rounded-xl border border-border bg-bg-elevated divide-y divide-border">
        {sources.length === 0 && (
          <li className="p-6 text-center text-sm text-fg-muted">暂无源。</li>
        )}
        {sources.map((s) => {
          const count = items.filter((it) => it.sourceId === s.id).length;
          const readme = readmes[s.id];
          const isOpen = !!expanded[s.id];
          return (
            <li key={s.id} className="p-4">
              <div className="flex items-center gap-3">
                {readme ? (
                  <button
                    onClick={() => setExpanded((m) => ({ ...m, [s.id]: !isOpen }))}
                    aria-label="toggle readme"
                    className="h-7 w-7 -ml-1 grid place-items-center rounded-md hover:bg-bg-subtle text-fg-muted"
                  >
                    {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </button>
                ) : (
                  <span className="size-7 -ml-1 grid place-items-center text-fg-subtle/40">
                    <BookOpen className="size-3.5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{s.label ?? `${s.owner}/${s.repo}`}</div>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-fg-subtle truncate block hover:underline">
                    {s.url}
                  </a>
                </div>
                <span className={clsx("text-xs", readme ? "text-fg-muted" : "text-fg-subtle")}>{count} md</span>
                <button
                  onClick={() => remove(s.id)}
                  aria-label="delete"
                  className="h-8 w-8 grid place-items-center rounded-md border border-border hover:border-red-500/50 hover:text-red-400"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {readme && isOpen && (
                <div className="mt-4 ml-6 rounded-lg border border-border bg-bg p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-fg-subtle">
                    <BookOpen className="size-3.5" />
                    README.md
                  </div>
                  <Markdown source={readme} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
