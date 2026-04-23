export function Hero({ count, tagCount }: { count: number; tagCount: number }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-grid noise-mask pointer-events-none" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-14">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
          Aggregate prompts.<br />
          <span className="text-fg-muted">One tag-centric view.</span>
        </h1>
        <p className="mt-4 max-w-xl text-fg-muted">
          从你信任的 git 仓库中拉取、聚合、按标签浏览 prompt。本身不保存内容，轻量、开箱即用。
        </p>
        <div className="mt-6 flex items-center gap-3 text-sm text-fg-subtle">
          <span><span className="text-fg">{count}</span> prompts</span>
          <span className="size-1 rounded-full bg-border" />
          <span><span className="text-fg">{tagCount}</span> tags</span>
        </div>
      </div>
    </section>
  );
}
