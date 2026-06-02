import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Panel, PageHeader, Stat, Pill } from "@/components/Panel";
import { data } from "@/lib/data";

export const Route = createFileRoute("/damage")({
  head: () => ({ meta: [{ title: "Damage Assessment · SHM" }] }),
  component: DamagePage,
});

const GRID = "var(--color-grid-line)";
const AXIS = "var(--color-muted-foreground)";

function DamagePage() {
  const d = data.damage;
  const probs = Object.entries(d.current_prediction.probabilities).map(([name, value]) => ({ name, value: value as number }));
  const importance = Object.entries(d.feature_importance).map(([name, value]) => ({ name, value: value as number }));
  const classColors = ["var(--color-emerald)", "var(--color-amber)", "var(--color-violet)", "var(--color-rose)"];

  const currentTone =
    d.current_prediction.class_name === "Healthy" ? "ok" :
    d.current_prediction.class_name === "Severe Damage" ? "danger" : "warn";

  return (
    <>
      <PageHeader title="Damage Assessment"
        subtitle="XGBoost multiclass classifier · 300 trees · stratified 75/25 split · evaluated on hold-out set."
        right={<Pill tone={currentTone as any}>Current: {d.current_prediction.class_name}</Pill>} />

      <div className="p-6 grid gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Accuracy" value={(d.metrics.accuracy * 100).toFixed(2) + "%"} accent="emerald" />
          <Stat label="Precision (weighted)" value={(d.metrics.precision * 100).toFixed(2) + "%"} />
          <Stat label="Recall (weighted)" value={(d.metrics.recall * 100).toFixed(2) + "%"} />
          <Stat label="F1 (weighted)" value={(d.metrics.f1 * 100).toFixed(2) + "%"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="Current Sample · Class Probabilities">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={probs} margin={{ left: 24, right: 16 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 10 }} />
                <YAxis tick={{ fill: AXIS, fontSize: 10 }} domain={[0, 1]} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => (v * 100).toFixed(2) + "%"} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {probs.map((_, i) => <Cell key={i} fill={classColors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mono text-xs text-muted-foreground mt-2">
              Confidence: <span className="text-foreground">{(d.current_prediction.confidence * 100).toFixed(2)}%</span>
            </div>
          </Panel>

          <Panel title="Confusion Matrix (test set)">
            <div className="grid" style={{ gridTemplateColumns: `auto repeat(${d.class_names.length}, 1fr)` }}>
              <div></div>
              {d.class_names.map((c) => (
                <div key={c} className="mono text-[10px] text-muted-foreground text-center px-1 pb-1 truncate">{c.split(" ")[0]}</div>
              ))}
              {d.class_names.map((c, i) => {
                const rowMax = Math.max(...d.confusion_matrix[i]);
                return (
                  <>
                    <div key={`l-${c}`} className="mono text-[10px] text-muted-foreground pr-2 py-2 text-right truncate">{c.split(" ")[0]}</div>
                    {d.confusion_matrix[i].map((v: number, j: number) => {
                      const intensity = rowMax > 0 ? v / rowMax : 0;
                      const isDiag = i === j;
                      const bg = isDiag
                        ? `color-mix(in oklab, var(--color-emerald) ${intensity * 70}%, var(--color-panel))`
                        : `color-mix(in oklab, var(--color-rose) ${intensity * 60}%, var(--color-panel))`;
                      return (
                        <div key={`${i}-${j}`} className="mono text-xs text-center py-3 border border-border/40 rounded font-semibold"
                          style={{ background: bg }}>
                          {v}
                        </div>
                      );
                    })}
                  </>
                );
              })}
            </div>
            <p className="mono text-[10px] text-muted-foreground mt-3">Rows: actual · Columns: predicted</p>
          </Panel>
        </div>

        <Panel title="XGBoost Feature Importance">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={importance} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="2 4" horizontal={false} />
              <XAxis type="number" tick={{ fill: AXIS, fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: AXIS, fontSize: 11 }} width={150} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="var(--color-cyan)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </>
  );
}
