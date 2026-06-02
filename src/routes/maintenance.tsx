import { createFileRoute } from "@tanstack/react-router";
import { Panel, PageHeader, Pill } from "@/components/Panel";
import { data } from "@/lib/data";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance Recommendations · SHM" }] }),
  component: MaintPage,
});

function MaintPage() {
  const r = data.recommendations;
  return (
    <>
      <PageHeader title="Maintenance Recommendations"
        subtitle="Generated from SHAP feature ranking, damage prediction, and current risk level."
        right={<Pill tone="info">Dynamic</Pill>} />

      <div className="p-6 grid gap-6">
        <Panel title="Top SHAP Drivers Considered">
          <div className="flex flex-wrap gap-2">
            {r.top_features.map((f, i) => (
              <span key={f} className={`mono text-xs px-3 py-1 rounded-md border ${i === 0 ? "border-primary/40 text-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
                #{i + 1} {f}
              </span>
            ))}
          </div>
        </Panel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {r.recommendations.map((rec, i) => (
            <div key={i} className="panel p-4 flex gap-3">
              <div className="shrink-0 h-9 w-9 rounded-md bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
                <Wrench className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Action {String(i + 1).padStart(2, "0")}</div>
                <div className="font-semibold text-sm">{rec.title}</div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{rec.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
