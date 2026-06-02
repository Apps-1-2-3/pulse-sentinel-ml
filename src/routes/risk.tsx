import { createFileRoute } from "@tanstack/react-router";
import { Panel, PageHeader, Stat, Pill } from "@/components/Panel";
import { data } from "@/lib/data";

export const Route = createFileRoute("/risk")({
  head: () => ({ meta: [{ title: "Risk Assessment · SHM" }] }),
  component: RiskPage,
});

function RiskPage() {
  const h = data.health;
  const pct = Math.max(0, Math.min(100, h.health_score));
  // Gauge: SVG arc
  const radius = 110;
  const circumference = Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const tone =
    h.risk === "Low" ? "ok" :
    h.risk === "Moderate" ? "warn" :
    h.risk === "High" ? "warn" : "danger";
  const arcColor =
    pct >= 80 ? "var(--color-emerald)" :
    pct >= 60 ? "var(--color-amber)" :
    pct >= 40 ? "color-mix(in oklab, var(--color-amber) 50%, var(--color-rose))" : "var(--color-rose)";

  return (
    <>
      <PageHeader title="Risk Assessment"
        subtitle="Health = 100 − (35% anomaly_rate + 45% damage_prob + 20% feature_deviation) · transparent scoring."
        right={<Pill tone={tone as any}>{h.risk} Risk</Pill>} />

      <div className="p-6 grid gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel title="Structural Health Score" className="lg:col-span-1">
            <div className="flex flex-col items-center py-2">
              <svg viewBox="0 0 260 160" className="w-full max-w-[280px]">
                <path d="M 20 140 A 110 110 0 0 1 240 140" fill="none" stroke="var(--color-border)" strokeWidth="14" strokeLinecap="round" />
                <path
                  d="M 20 140 A 110 110 0 0 1 240 140"
                  fill="none" stroke={arcColor} strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={offset}
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
                <text x="130" y="120" textAnchor="middle" className="mono" fontSize="44" fill="currentColor" fontWeight="600">
                  {pct.toFixed(1)}
                </text>
                <text x="130" y="142" textAnchor="middle" className="mono" fontSize="10" fill="var(--color-muted-foreground)">
                  / 100
                </text>
              </svg>
              <div className={`mt-2 text-lg font-semibold`} style={{ color: arcColor }}>{h.risk}</div>
            </div>
          </Panel>

          <Panel title="Score Components" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Stat label="Anomaly Rate (recent)" value={`${(h.components.anomaly_rate_recent * 100).toFixed(1)}%`} accent="amber" hint="Weight 35%" />
              <Stat label="Damage Probability" value={`${(h.components.damage_probability_recent * 100).toFixed(1)}%`} accent="rose" hint="Weight 45%" />
              <Stat label="Feature Deviation" value={(h.components.feature_deviation * 100).toFixed(1) + "%"} hint="Weight 20% · z-score vs healthy baseline" />
            </div>
            <div className="mt-5 panel p-3">
              <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Risk Bands</div>
              <div className="grid grid-cols-4 gap-2 text-xs mono">
                <div className={`p-2 rounded text-center ${h.risk === "Low" ? "bg-emerald/20 text-emerald" : "bg-secondary text-muted-foreground"}`}>Low ≥ 80</div>
                <div className={`p-2 rounded text-center ${h.risk === "Moderate" ? "bg-amber/20 text-amber" : "bg-secondary text-muted-foreground"}`}>Mod 60–79</div>
                <div className={`p-2 rounded text-center ${h.risk === "High" ? "bg-amber/30 text-amber" : "bg-secondary text-muted-foreground"}`}>High 40–59</div>
                <div className={`p-2 rounded text-center ${h.risk === "Critical" ? "bg-rose/20 text-rose" : "bg-secondary text-muted-foreground"}`}>Critical &lt; 40</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
