import { createFileRoute } from "@tanstack/react-router";
import { Panel, PageHeader, Pill } from "@/components/Panel";
import { data } from "@/lib/data";
import { FileDown } from "lucide-react";
import { jsPDF } from "jspdf";

export const Route = createFileRoute("/report")({
  head: () => ({ meta: [{ title: "Report · SHM" }] }),
  component: ReportPage,
});

function generatePdf() {
  const { analysis, anomaly, damage, shap, health, recommendations } = data;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let y = 56;

  const margin = 48;
  const line = (txt: string, size = 10, bold = false) => {
    if (y > H - 60) { doc.addPage(); y = 56; }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const wrapped = doc.splitTextToSize(txt, W - margin * 2);
    doc.text(wrapped, margin, y);
    y += wrapped.length * (size * 1.25);
  };
  const space = (px = 8) => { y += px; };
  const rule = () => { doc.setDrawColor(200); doc.line(margin, y, W - margin, y); y += 10; };
  const h1 = (t: string) => { space(6); line(t, 16, true); rule(); };
  const h2 = (t: string) => { space(4); line(t, 12, true); };

  // Cover
  doc.setFillColor(15, 23, 42); doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
  doc.text("Predictive Structural Health Monitoring", margin, 50);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text("Machine Learning + Explainable AI · Automated Report", margin, 70);
  doc.setTextColor(20);
  y = 120;

  h1("1. Dataset Summary");
  line(`Total records: ${analysis.total_records}`);
  line(`Clean records: ${analysis.clean_records}`);
  line(`Features: ${analysis.features.join(", ")}`);
  line(`Missing values: ${JSON.stringify(analysis.missing_values)}`);

  h1("2. Statistical Analysis");
  for (const f of analysis.features) {
    const m = (analysis.metrics as any)[f];
    line(`${f} — mean ${m.mean.toFixed(3)}, std ${m.std.toFixed(3)}, var ${m.variance.toFixed(3)}, RMS ${m.rms.toFixed(3)}, min ${m.min.toFixed(3)}, max ${m.max.toFixed(3)}`);
  }

  h1("3. Anomaly Detection (Isolation Forest)");
  line(`Anomalies detected: ${anomaly.n_anomalies} (${(anomaly.rate * 100).toFixed(2)}%)`);
  line(`Score range: [${anomaly.score_min.toFixed(3)}, ${anomaly.score_max.toFixed(3)}]`);

  h1("4. Damage Prediction (XGBoost)");
  line(`Accuracy: ${(damage.metrics.accuracy * 100).toFixed(2)}%`);
  line(`Precision (weighted): ${(damage.metrics.precision * 100).toFixed(2)}%`);
  line(`Recall (weighted): ${(damage.metrics.recall * 100).toFixed(2)}%`);
  line(`F1 (weighted): ${(damage.metrics.f1 * 100).toFixed(2)}%`);
  h2("Confusion matrix (rows=actual, cols=predicted):");
  line("           " + damage.class_names.map((c) => c.padStart(10)).join(""));
  damage.confusion_matrix.forEach((row: number[], i: number) => {
    line(damage.class_names[i].padEnd(11) + row.map((v) => String(v).padStart(10)).join(""));
  });
  h2("Current sample:");
  line(`Predicted class: ${damage.current_prediction.class_name}`);
  line(`Confidence: ${(damage.current_prediction.confidence * 100).toFixed(2)}%`);

  h1("5. SHAP Analysis");
  line(shap.textual_explanation);
  h2("Global mean(|SHAP|):");
  shap.features.forEach((f, i) => line(`  ${f}: ${shap.global_importance[i].toFixed(4)}`));
  h2("Local SHAP for current sample:");
  shap.features.forEach((f, i) =>
    line(`  ${f} (value ${shap.local_feature_values[i].toFixed(3)}): SHAP ${shap.local_shap_values[i].toFixed(4)}`)
  );

  h1("6. Risk Assessment");
  line(`Health Score: ${health.health_score.toFixed(2)} / 100`);
  line(`Risk Level: ${health.risk}`);
  line(`Components — anomaly: ${(health.components.anomaly_rate_recent * 100).toFixed(2)}%, damage prob: ${(health.components.damage_probability_recent * 100).toFixed(2)}%, deviation: ${(health.components.feature_deviation * 100).toFixed(2)}%`);

  h1("7. Maintenance Recommendations");
  recommendations.recommendations.forEach((r, i) => {
    h2(`${i + 1}. ${r.title}`);
    line(r.detail);
  });

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(120);
    doc.text(`Page ${i} / ${pages}  ·  Generated from real Python ML pipeline outputs`, margin, H - 24);
  }

  doc.save(`SHM_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function ReportPage() {
  const { analysis, anomaly, damage, health } = data;
  return (
    <>
      <PageHeader title="Automated Report"
        subtitle="Single-click PDF export of every module's computed results."
        right={
          <button
            onClick={generatePdf}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <FileDown className="h-4 w-4" /> Download PDF
          </button>
        } />

      <div className="p-6 grid gap-6">
        <Panel title="Report Contents">
          <ol className="space-y-2 text-sm">
            {[
              "Dataset summary (record counts, missing values)",
              "Statistical analysis (mean, median, variance, std, RMS, min/max)",
              "Anomaly detection results (Isolation Forest)",
              "Damage prediction results (XGBoost + confusion matrix + metrics)",
              "SHAP analysis (global importance + local explanation + textual)",
              "Risk assessment (health score, components, risk category)",
              "Maintenance recommendations (dynamic, from SHAP)",
            ].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="mono text-[10px] mt-1 text-primary">0{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Quick Snapshot" right={<Pill tone="info">From current run</Pill>}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mono text-xs">
            <div><div className="text-muted-foreground">Records</div><div className="text-foreground text-lg">{analysis.clean_records}</div></div>
            <div><div className="text-muted-foreground">Anomalies</div><div className="text-amber text-lg">{anomaly.n_anomalies}</div></div>
            <div><div className="text-muted-foreground">Accuracy</div><div className="text-emerald text-lg">{(damage.metrics.accuracy * 100).toFixed(2)}%</div></div>
            <div><div className="text-muted-foreground">Health</div><div className="text-lg">{health.health_score.toFixed(1)} · {health.risk}</div></div>
          </div>
        </Panel>
      </div>
    </>
  );
}
