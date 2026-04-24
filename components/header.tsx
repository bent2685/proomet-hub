"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Github, Users, Star, Settings as SettingsIcon, BookOpen } from "lucide-react";
import { CommandPalette } from "@/components/command-palette";
import { Hydrate } from "@/components/hydrate";
import { ThemeToggle } from "@/components/theme-toggle";
import clsx from "clsx";

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Hydrate />
      <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-md bg-bg/70 supports-[backdrop-filter]:bg-bg/60">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-block size-5 rounded-sm bg-accent text-accent-foreground text-[10px] leading-5 text-center font-bold">P</span>
            <span>proomet-hub</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-2 text-sm text-fg-muted">
            <NavLink href="/sources" icon={<Github className="size-4" />}>Sources</NavLink>
            <NavLink href="/articles" icon={<BookOpen className="size-4" />}>Articles</NavLink>
            <NavLink href="/authors" icon={<Users className="size-4" />}>Authors</NavLink>
            <NavLink href="/favorites" icon={<Star className="size-4" />}>Favorites</NavLink>
          </nav>
          <div className="flex-1" />
          <button
            onClick={() => setOpen(true)}
            className="group hidden sm:flex items-center gap-2 h-9 px-3 rounded-md border border-border hover:border-border-strong bg-bg-elevated text-sm text-fg-muted min-w-[260px]"
          >
            <Search className="size-4" />
            <span>Search prompts…</span>
            <span className="ml-auto flex items-center gap-1 text-xs">
              <kbd className="px-1.5 py-0.5 rounded bg-bg-subtle border border-border text-[10px]">⌘</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-bg-subtle border border-border text-[10px]">K</kbd>
            </span>
          </button>
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="settings"
            className="h-9 w-9 grid place-items-center rounded-md border border-border hover:border-border-strong bg-bg-elevated"
          >
            <SettingsIcon className="size-4" />
          </Link>
        </div>
      </header>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}

function NavLink({ href, icon, children }: { href: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md hover:bg-bg-elevated hover:text-fg transition-colors",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
