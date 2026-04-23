"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useMemo } from "react";
import { Search, Hash, User, FileText } from "lucide-react";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const items = useStore((s) => s.items);
  const router = useRouter();

  const tags = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) for (const t of it.tags) map.set(t, (map.get(t) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [items]);

  const authors = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) if (it.author) s.add(it.author);
    return [...s].slice(0, 20);
  }, [items]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      className="fixed inset-0 z-50 grid place-items-start justify-center pt-[12vh] bg-black/60 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-xl border border-border bg-bg-elevated shadow-glow overflow-hidden">
        <Command label="Global Search" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-fg-subtle">
          <div className="flex items-center gap-2 px-3 border-b border-border">
            <Search className="size-4 text-fg-muted" />
            <Command.Input
              autoFocus
              placeholder="搜索 prompt、tag、作者…"
              className="h-12 w-full bg-transparent outline-none text-sm placeholder:text-fg-subtle"
            />
          </div>
          <Command.List className="max-h-[50vh] overflow-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-fg-muted">没有匹配项</Command.Empty>

            <Command.Group heading="Prompts">
              {items.slice(0, 50).map((it) => (
                <Command.Item
                  key={it.id}
                  value={`${it.title} ${it.desc ?? ""} ${it.tags.join(" ")} ${it.author ?? ""}`}
                  onSelect={() => go(`/?p=${encodeURIComponent(it.id)}`)}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-bg-subtle cursor-pointer"
                >
                  <FileText className="size-4 text-fg-muted" />
                  <span className="truncate">{it.title}</span>
                  <span className="ml-auto text-xs text-fg-subtle truncate">{it.sourceLabel}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Tags">
              {tags.map(([t, c]) => (
                <Command.Item
                  key={`t-${t}`}
                  value={`tag ${t}`}
                  onSelect={() => go(`/?tag=${encodeURIComponent(t)}`)}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-bg-subtle cursor-pointer"
                >
                  <Hash className="size-4 text-fg-muted" />
                  <span>{t}</span>
                  <span className="ml-auto text-xs text-fg-subtle">{c}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Authors">
              {authors.map((a) => (
                <Command.Item
                  key={`a-${a}`}
                  value={`author ${a}`}
                  onSelect={() => go(`/authors/${encodeURIComponent(a)}`)}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-bg-subtle cursor-pointer"
                >
                  <User className="size-4 text-fg-muted" />
                  <span>{a}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
