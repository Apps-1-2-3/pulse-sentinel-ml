import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveContainer, ComposedChart, Line, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Panel, PageHeader, Stat, Pill } from "@/components/Panel";
import { data } from "@/lib/data";

export const Route = createFileRoute("/anomaly")({
  head: () => ({ meta: [{ title: "Anomaly Detection · SHM" }] }),
  component: AnomalyPage,
});

const GRID = "var(--color-grid-line)";
const AXIS = "var(--color-muted-foreground)";

function AnomalyPage() {
  const a = data.anomaly;
  const anomalies = a.series.filter((p) => p.anomaly === 1);

  return (
    <>
      <PageHeader title="Anomaly Detection"
        subtitle="Isolation Forest (scikit-learn) · 200 trees · 8% contamination · trained on the local dataset."
        right={<Pill tone="warn">{a.n_anomalies} anomalies</Pill>} />

      <div className="p-6 grid gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Anomalies" value={a.n_anomalies.toLocaleString()} accent="amber" />
          <Stat label="Rate" value={`${(a.rate * 100).toFixed(2)}%`} />
          <Stat label="Min Score" value={a.score_min.toFixed(3)} />
          <Stat label="Max Score" value={a.score_max.toFixed(3)} accent="emerald" />
        </div>

        <Panel title="Vibration · with anomaly overlay">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={a.series} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="t" tick={{ fill: AXIS, fontSize: 10 }} tickFormatter={(v) => String(v).slice(5, 10)} minTickGap={50} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="vibration" stroke="var(--color-cyan)" dot={false} strokeWidth={1.4} />
              <Scatter data={anomalies} dataKey="vibration" fill="var(--color-rose)" name="Anomaly" />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Anomaly Score Timeline">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={a.series} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="t" tick={{ fill: AXIS, fontSize: 10 }} tickFormatter={(v) => String(v).slice(5, 10)} minTickGap={50} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="score" stroke="var(--color-amber)" dot={false} strokeWidth={1.4} />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="mono text-[10px] text-muted-foreground mt-2">
            Lower scores indicate increasingly anomalous samples (sklearn convention).
          </p>
        </Panel>
      </div>
    </>
  );
}
