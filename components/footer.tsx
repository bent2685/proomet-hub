import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border mt-12">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between text-xs text-fg-subtle">
        <span>
          © {new Date().getFullYear()} proomet-hub
        </span>
        <a
          href="https://github.com/bent2685/proomet-hub"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-fg transition-colors"
        >
          <Github className="size-3.5" />
          bent2685/proomet-hub
        </a>
      </div>
    </footer>
  );
}
