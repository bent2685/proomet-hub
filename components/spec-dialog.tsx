"use client";

import { useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";

const SAMPLE = `---
title: 任务结束
tags: [流程, 任务]
author: bent
desc: 任务结束后可以做的一些事情
---

这里是 prompt 正文，复制按钮会把这部分整段复制走。
支持 Markdown 与代码块高亮。`;

export function SpecDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg underline underline-offset-4 decoration-dotted"
      >
        <HelpCircle className="size-4" />
        什么样的仓库可以被聚合？
      </button>

      {open && (
        <div
          role="dialog"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-xl border border-border bg-bg-elevated shadow-glow overflow-hidden flex flex-col max-h-[85vh]"
          >
            <header className="flex items-center gap-3 p-4 border-b border-border">
              <h2 className="text-base font-semibold tracking-tight flex-1">仓库需要满足什么？</h2>
              <button
                aria-label="close"
                onClick={() => setOpen(false)}
                className="h-8 w-8 grid place-items-center rounded-md border border-border hover:border-border-strong"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="p-5 space-y-4 overflow-auto text-[14px] leading-relaxed text-fg-muted">
              <p>
                任何 <span className="text-fg">公开 / 你有权限访问的 GitHub / Gitee 仓库</span>，只要把 prompt 写成 Markdown
                文件提交即可。
              </p>

              <div>
                <div className="text-fg font-medium mb-1.5">三条规矩</div>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    文件扩展名是 <code className="px-1 bg-bg-subtle rounded">.md</code>，放在仓库任意目录（递归扫描）
                  </li>
                  <li>
                    文件头部可选加 <code className="px-1 bg-bg-subtle rounded">---</code> 包裹的 frontmatter，字段如下
                  </li>
                  <li>
                    文件<strong className="text-fg">正文</strong>即 prompt 本体，详情页「Copy prompt」会整段复制
                  </li>
                </ol>
              </div>

              <div>
                <div className="text-fg font-medium mb-1.5">frontmatter 字段（均可选）</div>
                <ul className="space-y-1">
                  <li>
                    <code className="px-1 bg-bg-subtle rounded">title</code> / <code className="px-1 bg-bg-subtle rounded">name</code>
                    ：标题，缺省用文件名
                  </li>
                  <li>
                    <code className="px-1 bg-bg-subtle rounded">tags</code> /{" "}
                    <code className="px-1 bg-bg-subtle rounded">tag</code> /{" "}
                    <code className="px-1 bg-bg-subtle rounded">keywords</code> /{" "}
                    <code className="px-1 bg-bg-subtle rounded">labels</code>
                    ：用于首页 tag 筛选；数组或用逗号/空格分隔的字符串均可
                  </li>
                  <li>
                    <code className="px-1 bg-bg-subtle rounded">author</code> /{" "}
                    <code className="px-1 bg-bg-subtle rounded">by</code>
                    ：作者，会出现在 /authors 聚合页
                  </li>
                  <li>
                    <code className="px-1 bg-bg-subtle rounded">desc</code> /{" "}
                    <code className="px-1 bg-bg-subtle rounded">description</code> /{" "}
                    <code className="px-1 bg-bg-subtle rounded">summary</code>
                    ：卡片上显示的一句话描述
                  </li>
                </ul>
                <p className="text-xs mt-2">
                  没有 frontmatter 或 tags 缺失的 md 一样可见，会归入 <code className="px-1 bg-bg-subtle rounded">其他</code> 标签。
                </p>
              </div>

              <div>
                <div className="text-fg font-medium mb-1.5">一个完整示例</div>
                <pre className="rounded-md border border-border bg-bg p-3 text-xs overflow-auto font-mono">
{SAMPLE}
                </pre>
              </div>

              <div className="rounded-md border border-border bg-bg p-3 text-xs">
                <div className="text-fg font-medium mb-1">特殊约定</div>
                <ul className="space-y-0.5">
                  <li>
                    仓库根目录的 <code className="px-1 bg-bg-subtle rounded">README.md</code> 不进入 prompt 列表，会在
                    Sources 页的源条目下方展示
                  </li>
                  <li>拉取结果本地缓存 24 小时，想立即更新请点「强制刷新」</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
