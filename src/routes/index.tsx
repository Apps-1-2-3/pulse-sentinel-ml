import { createFileRoute } from "@tanstack/react-router";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, BarChart, Bar, Cell,
} from "recharts";
import { Panel, PageHeader, Stat, Pill } from "@/components/Panel";
import { data } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Structural Health Monitoring" },
      { name: "description", content: "Live structural health overview with vibration, strain, temperature and displacement trends from the trained ML pipeline." },
    ],
  }),
  component: Dashboard,
});

const GRID = "var(--color-grid-line)";
const AXIS = "var(--color-muted-foreground)";

const tooltipStyle = {
  contentStyle: { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: 11 },
};

function Sparkline({ keyName, color }: { keyName: "vibration" | "strain" | "temperature" | "displacement"; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data.series.series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={`g-${keyName}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="t" tick={{ fill: AXIS, fontSize: 10 }} tickFormatter={(v) => String(v).slice(5, 10)} minTickGap={40} />
        <YAxis tick={{ fill: AXIS, fontSize: 10 }} width={48} />
        <Tooltip {...tooltipStyle} />
        <Area type="monotone" dataKey={keyName} stroke={color} strokeWidth={1.6} fill={`url(#g-${keyName})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Dashboard() {
  const { analysis, anomaly, damage, health } = data;
  const dist = Object.entries(damage.class_distribution).map(([name, value]) => ({ name, value }));
  const distColors = ["var(--color-emerald)", "var(--color-amber)", "var(--color-violet)", "var(--color-rose)"];

  const riskTone =
    health.risk === "Low" ? "ok" :
    health.risk === "Moderate" ? "warn" :
    health.risk === "High" ? "warn" : "danger";

  return (
    <>
      <PageHeader
        title="Live Overview"
        subtitle="All metrics computed from the local dataset via the Python ML pipeline."
        right={<Pill tone="info">Dataset · {analysis.total_records.toLocaleString()} rows</Pill>}
      />

      <div className="p-6 grid gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Records" value={analysis.clean_records.toLocaleString()} hint={`${analysis.total_records - analysis.clean_records} missing rows`} />
          <Stat label="Health Score" value={health.health_score.toFixed(1)} accent={health.health_score >= 60 ? "emerald" : "rose"} hint="0 = critical · 100 = perfect" />
          <Stat label="Risk Level" value={health.risk} accent={health.risk === "Critical" || health.risk === "High" ? "rose" : "amber"} hint="Derived from anomaly + damage + deviation" />
          <Stat label="Anomalies" value={anomaly.n_anomalies.toLocaleString()} accent="amber" hint={`${(anomaly.rate * 100).toFixed(1)}% of records · Isolation Forest`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel title="Damage Distribution" className="lg:col-span-1" right={<Pill tone={riskTone as any}>{damage.current_prediction.class_name}</Pill>}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dist} layout="vertical" margin={{ left: 24, right: 16 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="2 4" horizontal={false} />
                <XAxis type="number" tick={{ fill: AXIS, fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: AXIS, fontSize: 11 }} width={110} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {dist.map((_, i) => <Cell key={i} fill={distColors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mono text-[10px] text-muted-foreground mt-2">
              Current prediction confidence: {(damage.current_prediction.confidence * 100).toFixed(1)}%
            </div>
          </Panel>

          <Panel title="Health Trend" className="lg:col-span-2" right={<Pill tone="info">Computed</Pill>}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={health.trend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: AXIS, fontSize: 10 }} tickFormatter={(v) => String(v).slice(5, 10)} minTickGap={50} />
                <YAxis domain={[0, 100]} tick={{ fill: AXIS, fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="health" stroke="var(--color-cyan)" strokeWidth={1.8} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Panel title="Vibration · g"><Sparkline keyName="vibration" color="var(--color-cyan)" /></Panel>
          <Panel title="Strain · µε"><Sparkline keyName="strain" color="var(--color-amber)" /></Panel>
          <Panel title="Temperature · °C"><Sparkline keyName="temperature" color="var(--color-emerald)" /></Panel>
          <Panel title="Displacement · mm"><Sparkline keyName="displacement" color="var(--color-violet)" /></Panel>
        </div>
      </div>
    </>
  );
}
