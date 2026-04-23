"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, Star, ExternalLink, User } from "lucide-react";
import type { PromptItem } from "@/lib/types";
import { Markdown } from "@/components/markdown";
import { useStore } from "@/lib/store";
import clsx from "clsx";

export function PromptDetail({ item, onClose }: { item: PromptItem | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const fav = useStore((s) => (item ? s.favorites.some((f) => f.id === item.id) : false));
  const toggle = useStore((s) => s.toggleFavorite);
  const sources = useStore((s) => s.sources);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  if (!item) return null;

  const src = sources.find((s) => s.id === item.sourceId);
  const repoUrl = src ? `${src.url.replace(/\.git$/, "").replace(/\/$/, "")}/blob/${src.branch ?? "HEAD"}/${item.path}` : undefined;

  const body = item.body;
  async function copyAll() {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch md:items-center md:justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-3xl md:max-h-[88vh] md:rounded-xl bg-bg-elevated border border-border shadow-glow flex flex-col"
      >
        <header className="flex items-start gap-3 p-4 border-b border-border">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight truncate">{item.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
              {item.author && (
                <span className="inline-flex items-center gap-1"><User className="size-3" />{item.author}</span>
              )}
              <span className="truncate">{item.sourceLabel}</span>
              <span className="truncate">/ {item.path}</span>
            </div>
            {item.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.tags.map((t) => (
                  <span key={t} className="h-5 px-1.5 rounded-md text-[10px] bg-bg-subtle border border-border text-fg-muted">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:opacity-90"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy prompt"}
            </button>
            <button
              aria-label="favorite"
              onClick={() => toggle(item.id)}
              className={clsx(
                "h-8 w-8 grid place-items-center rounded-md border border-border hover:border-border-strong",
                fav && "text-yellow-400",
              )}
            >
              <Star className={clsx("size-4", fav && "fill-current")} />
            </button>
            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 grid place-items-center rounded-md border border-border hover:border-border-strong"
                aria-label="open in github"
              >
                <ExternalLink className="size-4" />
              </a>
            )}
            <button
              aria-label="close"
              onClick={onClose}
              className="h-8 w-8 grid place-items-center rounded-md border border-border hover:border-border-strong"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>
        <div className="p-5 overflow-auto">
          {item.desc && <p className="text-sm text-fg-muted mb-4">{item.desc}</p>}
          <Markdown source={item.body} />
        </div>
      </div>
    </div>
  );
}
