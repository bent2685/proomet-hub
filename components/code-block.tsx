"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [html, setHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let alive = true;
    const theme = resolvedTheme === "light" ? "github-light" : "github-dark-default";
    fetch("/api/highlight", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, lang: lang ?? "text", theme }),
    })
      .then((r) => r.json())
      .then((j: { html: string }) => {
        if (alive) setHtml(j.html);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [code, lang, resolvedTheme]);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-border bg-bg-subtle">
      <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-fg-subtle border-b border-border">
        <span>{lang || "text"}</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 hover:text-fg transition-colors"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      {html ? (
        <div
          className="text-sm [&_pre]:!bg-transparent [&_pre]:!p-3 [&_pre]:overflow-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="p-3 text-sm overflow-auto">{code}</pre>
      )}
    </div>
  );
}
