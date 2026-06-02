import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine } from "recharts";
import { Panel, PageHeader, Pill } from "@/components/Panel";
import { data } from "@/lib/data";

export const Route = createFileRoute("/xai")({
  head: () => ({ meta: [{ title: "Explainable AI · SHAP" }] }),
  component: XaiPage,
});

const GRID = "var(--color-grid-line)";
const AXIS = "var(--color-muted-foreground)";

function XaiPage() {
  const s = data.shap;

  const global = s.features.map((f, i) => ({ name: f, value: s.global_importance[i] }))
    .sort((a, b) => b.value - a.value);

  // Waterfall: cumulative from base value
  const sorted = s.features.map((f, i) => ({ name: f, value: s.local_shap_values[i], featureValue: s.local_feature_values[i] }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  let cum = s.base_value;
  const waterfall = sorted.map((item) => {
    const start = cum;
    cum += item.value;
    return {
      name: item.name,
      base: Math.min(start, cum),
      delta: Math.abs(item.value),
      sign: item.value >= 0 ? "pos" : "neg",
      end: cum,
      featureValue: item.featureValue,
    };
  });

  return (
    <>
      <PageHeader title="Explainable AI (SHAP)"
        subtitle="TreeExplainer on the trained XGBoost model · real SHAP values, no manual heuristics."
        right={<Pill tone="info">Predicted: {s.predicted_class}</Pill>} />

      <div className="p-6 grid gap-6">
        <Panel title="Textual Explanation">
          <p className="text-sm leading-relaxed">
            <span className="mono text-primary">⮕ </span>{s.textual_explanation}
          </p>
          <p className="mono text-[10px] text-muted-foreground mt-2">
            Generated from the magnitudes of local SHAP values for the most recent monitored sample.
          </p>
        </Panel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="Global Feature Importance · mean(|SHAP|)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={global} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="2 4" horizontal={false} />
                <XAxis type="number" tick={{ fill: AXIS, fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: AXIS, fontSize: 11 }} width={150} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--color-cyan)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title={`Local Waterfall · prediction = ${s.predicted_class}`}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={waterfall} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="2 4" horizontal={false} />
                <XAxis type="number" tick={{ fill: AXIS, fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: AXIS, fontSize: 11 }} width={150} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v, _n, props: any) => [`Δ ${props.payload.sign === "pos" ? "+" : "-"}${Number(v).toFixed(3)}`, "SHAP"]} />
                <ReferenceLine x={s.base_value} stroke="var(--color-muted-foreground)" strokeDasharray="3 3" label={{ value: "base", fill: AXIS, fontSize: 10 }} />
                <Bar dataKey="base" stackId="w" fill="transparent" />
                <Bar dataKey="delta" stackId="w" radius={[0, 4, 4, 0]}>
                  {waterfall.map((w, i) => (
                    <Cell key={i} fill={w.sign === "pos" ? "var(--color-rose)" : "var(--color-emerald)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="mono text-[10px] text-muted-foreground mt-2">
              Red bars push the prediction toward the predicted class · green bars push away. Base value E[f(x)] = {s.base_value.toFixed(3)}.
            </p>
          </Panel>
        </div>

        <Panel title="SHAP Summary · per-feature contribution to current sample">
          <div className="overflow-x-auto">
            <table className="w-full text-xs mono">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2">Feature</th>
                  <th className="text-right px-3 py-2">Feature Value</th>
                  <th className="text-right px-3 py-2">SHAP Value</th>
                  <th className="text-right px-3 py-2">|SHAP|</th>
                  <th className="text-left px-3 py-2">Effect</th>
                </tr>
              </thead>
              <tbody>
                {s.features.map((f, i) => {
                  const sv = s.local_shap_values[i];
                  return (
                    <tr key={f} className="border-b border-border/50">
                      <td className="px-3 py-2">{f}</td>
                      <td className="text-right px-3 py-2">{s.local_feature_values[i].toFixed(3)}</td>
                      <td className={`text-right px-3 py-2 ${sv >= 0 ? "text-rose" : "text-emerald"}`}>{sv >= 0 ? "+" : ""}{sv.toFixed(4)}</td>
                      <td className="text-right px-3 py-2">{Math.abs(sv).toFixed(4)}</td>
                      <td className="px-3 py-2">{sv >= 0 ? "→ towards predicted class" : "← away from predicted class"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
