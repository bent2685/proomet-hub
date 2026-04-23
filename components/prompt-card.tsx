"use client";

import { Star, User } from "lucide-react";
import type { PromptItem } from "@/lib/types";
import { useStore } from "@/lib/store";
import clsx from "clsx";

export function PromptCard({ item, onOpen }: { item: PromptItem; onOpen: (id: string) => void }) {
  const fav = useStore((s) => s.favorites.some((f) => f.id === item.id));
  const toggle = useStore((s) => s.toggleFavorite);

  return (
    <button
      onClick={() => onOpen(item.id)}
      className="group relative text-left rounded-xl border border-border hover:border-border-strong bg-bg-elevated hover:bg-bg-subtle p-4 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium tracking-tight text-[15px] line-clamp-1">{item.title}</h3>
        <span
          role="button"
          tabIndex={0}
          aria-label="favorite"
          onClick={(e) => {
            e.stopPropagation();
            toggle(item.id);
          }}
          className={clsx(
            "shrink-0 size-7 -mr-1 -mt-1 grid place-items-center rounded-md hover:bg-bg",
            fav ? "text-yellow-400" : "text-fg-subtle opacity-0 group-hover:opacity-100",
          )}
        >
          <Star className={clsx("size-4", fav && "fill-current")} />
        </span>
      </div>
      {item.desc && (
        <p className="mt-1.5 text-[13px] text-fg-muted line-clamp-2 leading-relaxed">{item.desc}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        {item.tags.slice(0, 4).map((t) => (
          <span
            key={t}
            className="inline-flex items-center h-5 px-1.5 rounded-md text-[10px] bg-bg-subtle border border-border text-fg-muted"
          >
            {t}
          </span>
        ))}
        {item.tags.length > 4 && (
          <span className="text-[10px] text-fg-subtle self-center">+{item.tags.length - 4}</span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-fg-subtle">
        {item.author && (
          <span className="inline-flex items-center gap-1">
            <User className="size-3" />
            {item.author}
          </span>
        )}
        <span className="truncate ml-auto">{item.sourceLabel}</span>
      </div>
    </button>
  );
}
