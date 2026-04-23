"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { Download, Upload, ExternalLink, Info } from "lucide-react";
import { storage } from "@/lib/storage/client";

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const hydrate = useStore((s) => s.hydrate);
  const sources = useStore((s) => s.sources);
  const favorites = useStore((s) => s.favorites);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const active = mounted ? theme ?? resolvedTheme : undefined;

  async function save(partial: Partial<typeof settings>) {
    await setSettings({ ...settings, ...partial });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  async function onExport() {
    const data = { sources, favorites, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proomet-hub-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImport(file: File) {
    const raw = await file.text();
    try {
      const json = JSON.parse(raw);
      if (Array.isArray(json.sources)) await storage.setSources(json.sources);
      if (Array.isArray(json.favorites)) await storage.setFavorites(json.favorites);
      if (json.settings && typeof json.settings === "object") await storage.setSettings(json.settings);
      useStore.setState({ hydrated: false });
      await hydrate();
      alert("导入完成");
    } catch {
      alert("无效的配置文件");
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-fg-muted mt-1">
          {saved && <span className="text-emerald-400">已保存 ✓</span>}
        </p>
      </div>

      <Section title="外观" desc="主题偏好会跟随系统 / 或手动固定。">
        <div className="flex items-center gap-2">
          <ThemeBtn active={active === "light"} onClick={() => setTheme("light")}>Light</ThemeBtn>
          <ThemeBtn active={active === "dark"} onClick={() => setTheme("dark")}>Dark</ThemeBtn>
          <ThemeBtn active={active === "system"} onClick={() => setTheme("system")}>System</ThemeBtn>
        </div>
      </Section>

      <Section
        title="GitHub Token (PAT)"
        desc="GitHub 匿名接口限流 60 次/小时，极易用尽；填入 PAT 后提升到 5000 次/小时。读公开仓库无需额外权限。Token 只保存在本机。"
      >
        <input
          type="password"
          defaultValue={settings.githubToken ?? ""}
          onBlur={(e) => save({ githubToken: e.target.value || undefined })}
          placeholder="github_pat_… 或 ghp_…"
          className="w-full h-10 px-3 rounded-md bg-bg-elevated border border-border focus:border-border-strong outline-none text-sm font-mono"
        />

        <div className="rounded-lg border border-border bg-bg-elevated px-4 py-3 space-y-2 text-[13px] text-fg-muted">
          <div className="flex items-center gap-2 text-fg">
            <Info className="size-4" />
            <span className="font-medium">三步拿到 token</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              点下方按钮 → <span className="text-fg">Repository access</span> 选{" "}
              <code className="px-1 bg-bg-subtle rounded">Public Repositories (read-only)</code>
            </li>
            <li>拉到底点 <span className="text-fg">Generate token</span>（其它什么都不用填）</li>
            <li>复制 <code className="px-1 bg-bg-subtle rounded">github_pat_…</code> 粘贴到上方输入框</li>
          </ol>
          <a
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90"
          >
            <ExternalLink className="size-4" />
            打开 GitHub 创建页
          </a>
        </div>
      </Section>

      <Section title="Gitee Token" desc="可选，用于 Gitee 源。">
        <input
          type="password"
          defaultValue={settings.giteeToken ?? ""}
          onBlur={(e) => save({ giteeToken: e.target.value || undefined })}
          placeholder=""
          className="w-full h-10 px-3 rounded-md bg-bg-elevated border border-border focus:border-border-strong outline-none text-sm font-mono"
        />
      </Section>

      <Section title="导入 / 导出配置">
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border hover:border-border-strong bg-bg-elevated text-sm"
          >
            <Download className="size-4" />
            导出 JSON
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border hover:border-border-strong bg-bg-elevated text-sm"
          >
            <Upload className="size-4" />
            导入 JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        {desc && <p className="text-xs text-fg-subtle">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

function ThemeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-4 rounded-md text-sm border ${active ? "bg-accent text-accent-foreground border-accent" : "border-border bg-bg-elevated hover:border-border-strong"}`}
    >
      {children}
    </button>
  );
}
