import type { ReactNode } from "react";

export function PageHeader({
  title, subtitle, right,
}: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="border-b border-border bg-panel/40 backdrop-blur sticky top-0 z-10">
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.2em] text-primary">Module</div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

export function Panel({
  title, right, children, className = "",
}: { title: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-header">
        <span>{title}</span>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({
  label, value, hint, accent = "primary",
}: { label: string; value: ReactNode; hint?: string; accent?: "primary" | "amber" | "rose" | "emerald" }) {
  const color = {
    primary: "text-primary",
    amber: "text-amber",
    rose: "text-rose",
    emerald: "text-emerald",
  }[accent];
  return (
    <div className="panel p-4">
      <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={`metric-value text-3xl mt-2 ${color}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "danger" | "info" }) {
  const map = {
    neutral: "bg-secondary text-secondary-foreground",
    ok: "bg-emerald/15 text-emerald border border-emerald/30",
    warn: "bg-amber/15 text-amber border border-amber/30",
    danger: "bg-rose/15 text-rose border border-rose/30",
    info: "bg-primary/15 text-primary border border-primary/30",
  }[tone];
  return (
    <span className={`mono inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider ${map}`}>
      {children}
    </span>
  );
}
