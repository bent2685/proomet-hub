"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { Download, Upload } from "lucide-react";
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

      <Section title="GitHub Token (PAT)" desc="用于访问私有仓库或提升 API 限额。仅本机持久化。">
        <input
          type="password"
          defaultValue={settings.githubToken ?? ""}
          onBlur={(e) => save({ githubToken: e.target.value || undefined })}
          placeholder="ghp_…"
          className="w-full h-10 px-3 rounded-md bg-bg-elevated border border-border focus:border-border-strong outline-none text-sm font-mono"
        />
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
