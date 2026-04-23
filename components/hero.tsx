import { SpecDialog } from "@/components/spec-dialog";

export function Hero({ count, tagCount }: { count: number; tagCount: number }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-grid noise-mask pointer-events-none" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-14">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
          Proomet-hub<br />
          <span className="text-fg-muted">聚合你的 prompt</span>
        </h1>
        <p className="mt-4 max-w-xl text-fg-muted">
          从你信任的 git 仓库中拉取、聚合 prompt。轻量的开箱即用，冷冰冰的 Prompt 也可以很贴心。
        </p>
        <SpecDialog />
        <div className="mt-6 flex items-center gap-3 text-sm text-fg-subtle">
          <span><span className="text-fg">{count}</span> prompts</span>
          <span className="size-1 rounded-full bg-border" />
          <span><span className="text-fg">{tagCount}</span> tags</span>
        </div>
      </div>
    </section>
  );
}
