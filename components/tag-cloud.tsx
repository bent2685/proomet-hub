"use client";

import clsx from "clsx";
import { useMemo } from "react";

export function TagCloud({
  tagCounts,
  selected,
  onToggle,
  onClear,
}: {
  tagCounts: [string, number][];
  selected: Set<string>;
  onToggle: (tag: string) => void;
  onClear: () => void;
}) {
  const max = useMemo(() => tagCounts.reduce((m, [, n]) => Math.max(m, n), 1), [tagCounts]);
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        onClick={onClear}
        className={clsx(
          "h-7 px-3 rounded-full text-xs border transition-colors",
          selected.size === 0
            ? "bg-accent text-accent-foreground border-accent"
            : "border-border hover:border-border-strong text-fg-muted",
        )}
      >
        All
      </button>
      {tagCounts.map(([tag, n]) => {
        const active = selected.has(tag);
        const intensity = n / max;
        const opacity = 0.55 + intensity * 0.45;
        return (
          <button
            key={tag}
            onClick={() => onToggle(tag)}
            className={clsx(
              "h-7 px-3 rounded-full text-xs border transition-all",
              active
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border hover:border-border-strong bg-bg-elevated",
            )}
            style={active ? undefined : { opacity }}
          >
            <span className="mr-1">{tag}</span>
            <span className="text-[10px] opacity-60">{n}</span>
          </button>
        );
      })}
    </div>
  );
}
