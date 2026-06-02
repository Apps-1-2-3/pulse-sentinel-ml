import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react";
import { Panel, PageHeader, Pill } from "@/components/Panel";
import { data } from "@/lib/data";

export const Route = createFileRoute("/analysis")({
  head: () => ({ meta: [{ title: "Data Analysis · SHM" }] }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const a = data.analysis;
  const features = a.features;

  return (
    <>
      <PageHeader title="Data Analysis"
        subtitle="Computed via Pandas / NumPy on the local dataset."
        right={<Pill tone="info">{a.clean_records.toLocaleString()} / {a.total_records.toLocaleString()} rows</Pill>} />

      <div className="p-6 grid gap-6">
        <Panel title="Statistical Summary (per feature)">
          <div className="overflow-x-auto">
            <table className="w-full text-xs mono">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2">Feature</th>
                  <th className="text-right px-3 py-2">Mean</th>
                  <th className="text-right px-3 py-2">Median</th>
                  <th className="text-right px-3 py-2">Std</th>
                  <th className="text-right px-3 py-2">Variance</th>
                  <th className="text-right px-3 py-2">RMS</th>
                  <th className="text-right px-3 py-2">Min</th>
                  <th className="text-right px-3 py-2">Max</th>
                  <th className="text-right px-3 py-2">Missing</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f) => {
                  const m = (a.metrics as any)[f];
                  return (
                    <tr key={f} className="border-b border-border/50 hover:bg-secondary/40">
                      <td className="px-3 py-2">{f}</td>
                      <td className="text-right px-3 py-2">{m.mean.toFixed(3)}</td>
                      <td className="text-right px-3 py-2">{m.median.toFixed(3)}</td>
                      <td className="text-right px-3 py-2">{m.std.toFixed(3)}</td>
                      <td className="text-right px-3 py-2">{m.variance.toFixed(3)}</td>
                      <td className="text-right px-3 py-2">{m.rms.toFixed(3)}</td>
                      <td className="text-right px-3 py-2">{m.min.toFixed(3)}</td>
                      <td className="text-right px-3 py-2">{m.max.toFixed(3)}</td>
                      <td className="text-right px-3 py-2 text-amber">{(a.missing_values as any)[f]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="Correlation Matrix">
            <div className="grid" style={{ gridTemplateColumns: `auto repeat(${features.length}, 1fr)` }}>
              <div></div>
              {features.map((f) => (
                <div key={f} className="mono text-[10px] text-muted-foreground text-center px-1 pb-1 truncate">{f.split("_")[0]}</div>
              ))}
              {features.map((f, i) => (
                <>
                  <div key={`l-${f}`} className="mono text-[10px] text-muted-foreground pr-2 py-1 truncate text-right">{f.split("_")[0]}</div>
                  {a.correlation[i].map((v: number, j: number) => {
                    const intensity = Math.abs(v);
                    const bg = v >= 0
                      ? `color-mix(in oklab, var(--color-cyan) ${intensity * 70}%, var(--color-panel))`
                      : `color-mix(in oklab, var(--color-rose) ${intensity * 70}%, var(--color-panel))`;
                    return (
                      <div key={`${i}-${j}`} className="mono text-[11px] text-center py-2 border border-border/40 rounded"
                        style={{ background: bg }}>
                        {v.toFixed(2)}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </Panel>

          <Panel title="Dataset Preview (first 15 rows)">
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-[11px] mono">
                <thead className="sticky top-0 bg-panel text-muted-foreground">
                  <tr className="border-b border-border">
                    {Object.keys(a.preview[0]).map((k) => (
                      <th key={k} className="text-left px-2 py-2 whitespace-nowrap">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {a.preview.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-border/40">
                      {Object.entries(row).map(([k, v]) => (
                        <td key={k} className="px-2 py-1 whitespace-nowrap">
                          {typeof v === "number" ? v.toFixed(3) : String(v).slice(0, 19)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
