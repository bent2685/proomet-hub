"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/code-block";

export function Markdown({ source }: { source: string }) {
  return (
    <div className="max-w-none text-[14px] leading-7 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-4 [&_blockquote]:text-fg-muted [&_blockquote]:my-3 [&_a]:underline [&_a]:underline-offset-2 [&_a]:text-fg [&_code]:bg-bg-subtle [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_hr]:border-border [&_hr]:my-6 [&_table]:w-full [&_table]:my-4 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }: any) {
            const child = Array.isArray(children) ? children[0] : children;
            const props = child?.props ?? {};
            const className: string = props.className ?? "";
            const match = /language-(\w+)/.exec(className);
            const text = String(props.children ?? "").replace(/\n$/, "");
            return <CodeBlock code={text} lang={match?.[1]} />;
          },
          code({ className, children, ...props }: any) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
