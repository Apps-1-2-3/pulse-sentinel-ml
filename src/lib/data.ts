// Static, real-ML-derived datasets. Generated once by backend/run_pipeline.py.
import analysis from "@/data/analysis.json";
import anomaly from "@/data/anomaly.json";
import damage from "@/data/damage.json";
import shap from "@/data/shap.json";
import health from "@/data/health.json";
import recommendations from "@/data/recommendations.json";
import series from "@/data/series.json";

export const data = { analysis, anomaly, damage, shap, health, recommendations, series } as const;
export type AppData = typeof data;
