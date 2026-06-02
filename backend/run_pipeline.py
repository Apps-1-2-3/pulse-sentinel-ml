"""
Real ML pipeline. Reads datasets/*.csv, runs:
  - Data analysis (stats, missing values, correlations)
  - Isolation Forest anomaly detection
  - XGBoost damage classification with full evaluation
  - SHAP global + local explanations
  - Health score + risk category
  - Dynamic maintenance recommendations
Writes everything into src/data/*.json so the React app renders REAL outputs.
"""
import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
)
from sklearn.model_selection import train_test_split
import xgboost as xgb
import shap

OUT = Path("src/data"); OUT.mkdir(parents=True, exist_ok=True)
FEATURES = ["vibration_g", "strain_microstrain", "temperature_c", "displacement_mm"]
CLASS_NAMES = ["Healthy", "Minor Damage", "Moderate Damage", "Severe Damage"]

def write(name, obj):
    (OUT / name).write_text(json.dumps(obj, default=float, indent=2))
    print("wrote", name)

# ---------- Load ----------
df = pd.read_csv("datasets/structure_data.csv", parse_dates=["timestamp"])
df_clean = df.dropna(subset=FEATURES).reset_index(drop=True)
print("rows:", len(df), "after dropna:", len(df_clean))

# ---------- Data analysis ----------
missing = df[FEATURES].isna().sum().to_dict()
stats = df_clean[FEATURES].describe().round(4).to_dict()
extra = {}
for f in FEATURES:
    s = df_clean[f]
    extra[f] = {
        "mean": float(s.mean()),
        "median": float(s.median()),
        "variance": float(s.var()),
        "std": float(s.std()),
        "rms": float(np.sqrt(np.mean(s.values ** 2))),
        "min": float(s.min()),
        "max": float(s.max()),
    }
corr = df_clean[FEATURES].corr().round(4).values.tolist()
preview = df_clean.head(15).copy()
preview["timestamp"] = preview["timestamp"].astype(str)
write("analysis.json", {
    "features": FEATURES,
    "missing_values": missing,
    "describe": stats,
    "metrics": extra,
    "correlation": corr,
    "preview": preview.to_dict(orient="records"),
    "total_records": int(len(df)),
    "clean_records": int(len(df_clean)),
})

# ---------- Anomaly detection ----------
iso = IsolationForest(n_estimators=200, contamination=0.08, random_state=42)
iso.fit(df_clean[FEATURES])
scores = iso.decision_function(df_clean[FEATURES])
labels = (iso.predict(df_clean[FEATURES]) == -1).astype(int)
n_anom = int(labels.sum())

# Downsample for plotting
step = max(1, len(df_clean) // 800)
ts_idx = list(range(0, len(df_clean), step))
anom_series = [{
    "t": df_clean["timestamp"].iloc[i].isoformat(),
    "vibration": float(df_clean["vibration_g"].iloc[i]),
    "strain": float(df_clean["strain_microstrain"].iloc[i]),
    "temperature": float(df_clean["temperature_c"].iloc[i]),
    "displacement": float(df_clean["displacement_mm"].iloc[i]),
    "score": float(scores[i]),
    "anomaly": int(labels[i]),
} for i in ts_idx]
write("anomaly.json", {
    "n_anomalies": n_anom,
    "rate": n_anom / len(df_clean),
    "score_min": float(scores.min()),
    "score_max": float(scores.max()),
    "series": anom_series,
})

# ---------- Damage classification (XGBoost) ----------
X = df_clean[FEATURES].values
y = df_clean["damage_class"].values
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
model = xgb.XGBClassifier(
    n_estimators=300, max_depth=5, learning_rate=0.08,
    subsample=0.9, colsample_bytree=0.9, eval_metric="mlogloss",
    tree_method="hist", random_state=42,
)
model.fit(X_tr, y_tr)
y_pred = model.predict(X_te)
proba = model.predict_proba(X_te)

acc = accuracy_score(y_te, y_pred)
prec = precision_score(y_te, y_pred, average="weighted", zero_division=0)
rec = recall_score(y_te, y_pred, average="weighted", zero_division=0)
f1 = f1_score(y_te, y_pred, average="weighted", zero_division=0)
cm = confusion_matrix(y_te, y_pred).tolist()
class_dist = {CLASS_NAMES[c]: int((y == c).sum()) for c in range(4)}

# Predictions over time for dashboard
full_pred = model.predict(X)
full_proba = model.predict_proba(X)
current_class = int(full_pred[-1])
current_conf = float(full_proba[-1].max())

write("damage.json", {
    "class_names": CLASS_NAMES,
    "metrics": {"accuracy": acc, "precision": prec, "recall": rec, "f1": f1},
    "confusion_matrix": cm,
    "class_distribution": class_dist,
    "current_prediction": {
        "class_index": current_class,
        "class_name": CLASS_NAMES[current_class],
        "confidence": current_conf,
        "probabilities": {CLASS_NAMES[i]: float(full_proba[-1][i]) for i in range(4)},
    },
    "feature_importance": {FEATURES[i]: float(v) for i, v in enumerate(model.feature_importances_)},
})

# ---------- SHAP ----------
explainer = shap.TreeExplainer(model)
# Use a sample to keep compute reasonable
sample_idx = np.random.RandomState(0).choice(len(X), size=min(500, len(X)), replace=False)
sv = explainer.shap_values(X[sample_idx])  # shape (n, features) per class for multiclass list
# For multiclass XGBoost shap returns array (n, features, classes) in 0.52
sv_arr = np.array(sv)
if sv_arr.ndim == 3:
    # (n, features, classes)
    mean_abs_per_class = np.mean(np.abs(sv_arr), axis=0)  # (features, classes)
    global_importance = mean_abs_per_class.mean(axis=1)   # mean across classes
else:
    global_importance = np.mean(np.abs(sv_arr), axis=0)

global_importance = global_importance.tolist()

# Local explanation for the most recent sample
local_sv = explainer.shap_values(X[-1:].astype(float))
local_arr = np.array(local_sv)
if local_arr.ndim == 3:
    local_for_pred = local_arr[0, :, current_class].tolist()
else:
    local_for_pred = local_arr[0].tolist()

# Base value
base = explainer.expected_value
if isinstance(base, (list, np.ndarray)):
    base_val = float(np.array(base).flatten()[current_class if np.array(base).size > 1 else 0])
else:
    base_val = float(base)

# Textual explanation
top = sorted(zip(FEATURES, [abs(v) for v in local_for_pred]), key=lambda x: -x[1])[:2]
top_names = [t[0].split("_")[0] for t in top]
textual = (
    f"The model predicts {CLASS_NAMES[current_class]} primarily because "
    f"{top_names[0]} and {top_names[1]} contribute most to the prediction."
)

write("shap.json", {
    "features": FEATURES,
    "global_importance": global_importance,
    "local_shap_values": local_for_pred,
    "local_feature_values": X[-1].tolist(),
    "base_value": base_val,
    "predicted_class": CLASS_NAMES[current_class],
    "textual_explanation": textual,
})

# ---------- Health & risk ----------
# Use last 200 samples for current condition
recent = slice(-200, None)
anom_recent_rate = float(labels[recent].mean())
damage_prob_unhealthy = float(full_proba[recent][:, 1:].sum(axis=1).mean())
# Feature deviation vs healthy baseline
healthy_mask = y == 0
baseline_mean = X[healthy_mask].mean(axis=0)
baseline_std = X[healthy_mask].std(axis=0) + 1e-9
recent_X = X[recent]
z = np.abs((recent_X - baseline_mean) / baseline_std).mean()
deviation_norm = float(min(1.0, z / 3.0))

# Weighted health score
penalty = 100 * (0.35 * anom_recent_rate + 0.45 * damage_prob_unhealthy + 0.20 * deviation_norm)
health_score = float(max(0.0, min(100.0, 100.0 - penalty)))
if health_score >= 80:
    risk = "Low"
elif health_score >= 60:
    risk = "Moderate"
elif health_score >= 40:
    risk = "High"
else:
    risk = "Critical"

# Trend (downsampled)
trend_step = max(1, len(df_clean) // 600)
trend = []
for i in range(0, len(df_clean), trend_step):
    p = full_proba[i, 1:].sum()
    s = scores[i]
    # simple rolling health proxy
    h = 100 - 100 * (0.5 * p + 0.5 * max(0, -s))
    trend.append({"t": df_clean["timestamp"].iloc[i].isoformat(), "health": float(max(0, min(100, h)))})

write("health.json", {
    "health_score": health_score,
    "risk": risk,
    "components": {
        "anomaly_rate_recent": anom_recent_rate,
        "damage_probability_recent": damage_prob_unhealthy,
        "feature_deviation": deviation_norm,
    },
    "trend": trend,
})

# ---------- Recommendations ----------
fi_pairs = sorted(zip(FEATURES, global_importance), key=lambda x: -x[1])
top_feature = fi_pairs[0][0]

recs = []
if "vibration" in top_feature:
    recs.append({
        "title": "Inspect structural joints and bolted connections",
        "detail": "Vibration is the dominant SHAP contributor. Loose connections or fatigue cracks at joints often manifest as elevated vibration energy."
    })
if "strain" in top_feature:
    recs.append({
        "title": "Inspect for crack formation in tension members",
        "detail": "Strain is the dominant SHAP contributor. Increased strain readings can indicate micro-crack propagation or section loss."
    })
if "displacement" in top_feature:
    recs.append({
        "title": "Verify bearing condition and deck alignment",
        "detail": "Displacement dominates the explanation. Check bearings, expansion joints, and global deck geometry."
    })
if "temperature" in top_feature:
    recs.append({
        "title": "Review thermal compensation in sensor model",
        "detail": "Temperature is driving predictions; ensure structural readings are properly temperature-compensated before alarming."
    })

# Always add the secondary feature too
second = fi_pairs[1][0]
recs.append({
    "title": f"Schedule targeted inspection: {second.replace('_', ' ')}",
    "detail": f"{second.replace('_',' ').title()} is the second strongest contributor in the global SHAP analysis."
})

if risk == "Critical":
    recs.insert(0, {
        "title": "Immediate engineering inspection recommended",
        "detail": "Health score is below 40. Restrict load and dispatch a structural engineer on-site."
    })
elif risk == "High":
    recs.insert(0, {
        "title": "Increase monitoring frequency to hourly",
        "detail": "Risk is High. Tighten alarm thresholds and review trends daily."
    })
elif risk == "Moderate":
    recs.insert(0, {
        "title": "Plan preventive inspection within 30 days",
        "detail": "Risk is Moderate. Schedule a routine visual inspection focusing on the top SHAP features."
    })
else:
    recs.insert(0, {
        "title": "Continue routine monitoring schedule",
        "detail": "Risk is Low. Maintain quarterly inspections and monthly data reviews."
    })

write("recommendations.json", {"recommendations": recs, "top_features": [p[0] for p in fi_pairs]})

# ---------- Dashboard time-series (downsampled) ----------
ds_step = max(1, len(df_clean) // 500)
series = []
for i in range(0, len(df_clean), ds_step):
    series.append({
        "t": df_clean["timestamp"].iloc[i].isoformat(),
        "vibration": float(df_clean["vibration_g"].iloc[i]),
        "strain": float(df_clean["strain_microstrain"].iloc[i]),
        "temperature": float(df_clean["temperature_c"].iloc[i]),
        "displacement": float(df_clean["displacement_mm"].iloc[i]),
    })
write("series.json", {"series": series})

print("DONE")
