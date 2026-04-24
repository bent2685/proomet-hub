"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { extractHeadings } from "@/lib/articles";

function findEl(slug: string): HTMLElement | null {
  return (
    document.getElementById(slug) ??
    (document.querySelector(`[data-heading-slug="${CSS.escape(slug)}"]`) as HTMLElement | null)
  );
}

export function ArticleOutline({ body }: { body: string }) {
  const headings = useMemo(() => extractHeadings(body), [body]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    let obs: IntersectionObserver | null = null;
    let cancelled = false;
    let attempts = 0;

    const setup = () => {
      if (cancelled) return;
      const els = headings
        .map((h) => findEl(h.slug))
        .filter((e): e is HTMLElement => !!e);
      if (els.length === 0) {
        if (attempts++ < 20) setTimeout(setup, 100);
        return;
      }
      obs = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort(
              (a, b) => (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0),
            );
          if (visible[0]) setActive(visible[0].target.id);
        },
        { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
      );
      els.forEach((e) => obs!.observe(e));
    };
    setup();

    return () => {
      cancelled = true;
      obs?.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) {
    return <div className="text-xs text-fg-subtle p-2">无大纲</div>;
  }

  return (
    <nav className="text-sm space-y-0.5">
      <div className="text-[11px] uppercase tracking-wide text-fg-subtle px-2 mb-1">Outline</div>
      {headings.map((h) => (
        <a
          key={h.slug}
          href={`#${h.slug}`}
          onClick={(e) => {
            e.preventDefault();
            const el = findEl(h.slug);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
              history.replaceState(null, "", `#${h.slug}`);
              setActive(h.slug);
            }
          }}
          className={clsx(
            "block py-1 px-2 rounded-md hover:bg-bg-subtle text-fg-muted leading-snug",
            active === h.slug && "bg-accent/10 text-fg",
          )}
          style={{ paddingLeft: (h.level - 1) * 10 + 8 }}
        >
          <span className="line-clamp-2">{h.text}</span>
        </a>
      ))}
    </nav>
  );
}
