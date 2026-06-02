"""
Generate a realistic synthetic Structural Health Monitoring dataset.
This runs ONCE to produce the local CSVs in datasets/.
The physics-inspired model: a bridge instrumented with vibration (g),
strain (microstrain), temperature (C), and displacement (mm) sensors,
sampled hourly across a year. Damage progressively appears in some windows.
"""
import numpy as np
import pandas as pd
from pathlib import Path

rng = np.random.default_rng(42)
N = 4000  # ~166 days hourly

t = np.arange(N)
hours = t % 24
days = t // 24

# Baseline environmental temperature with diurnal + seasonal cycle
temp = (
    18
    + 10 * np.sin(2 * np.pi * days / 365)
    + 6 * np.sin(2 * np.pi * hours / 24 - np.pi / 2)
    + rng.normal(0, 1.2, N)
)

# Traffic-driven vibration: higher at rush hours
traffic = 0.4 + 0.6 * (np.exp(-((hours - 8) ** 2) / 6) + np.exp(-((hours - 18) ** 2) / 6))
vibration = 0.05 + 0.08 * traffic + rng.normal(0, 0.012, N)

# Strain depends on temperature (thermal expansion) and traffic load
strain = 120 + 2.1 * (temp - 18) + 180 * traffic + rng.normal(0, 6, N)

# Displacement: small, depends on load + temp
displacement = 0.8 + 0.015 * (temp - 18) + 1.4 * traffic + rng.normal(0, 0.08, N)

# Assign damage state by progressive degradation in selected windows
damage_class = np.zeros(N, dtype=int)  # 0 Healthy
# Minor: gradual onset
minor_idx = (t > 1500) & (t < 2200)
damage_class[minor_idx] = 1
vibration[minor_idx] += rng.normal(0.015, 0.005, minor_idx.sum())
strain[minor_idx] += rng.normal(25, 8, minor_idx.sum())

# Moderate
mod_idx = (t > 2600) & (t < 3100)
damage_class[mod_idx] = 2
vibration[mod_idx] += rng.normal(0.045, 0.01, mod_idx.sum())
strain[mod_idx] += rng.normal(70, 15, mod_idx.sum())
displacement[mod_idx] += rng.normal(0.35, 0.1, mod_idx.sum())

# Severe
sev_idx = t > 3500
damage_class[sev_idx] = 3
vibration[sev_idx] += rng.normal(0.11, 0.02, sev_idx.sum())
strain[sev_idx] += rng.normal(160, 25, sev_idx.sum())
displacement[sev_idx] += rng.normal(0.9, 0.2, sev_idx.sum())

# A few sparse missing values for realism (data analysis module shows them)
df = pd.DataFrame(
    {
        "timestamp": pd.date_range("2025-01-01", periods=N, freq="h"),
        "vibration_g": np.round(vibration, 5),
        "strain_microstrain": np.round(strain, 3),
        "temperature_c": np.round(temp, 3),
        "displacement_mm": np.round(displacement, 4),
        "damage_class": damage_class,
    }
)
for col in ["vibration_g", "strain_microstrain", "temperature_c", "displacement_mm"]:
    mask = rng.random(N) < 0.004
    df.loc[mask, col] = np.nan

Path("datasets").mkdir(exist_ok=True)
df.to_csv("datasets/structure_data.csv", index=False)
# Conventional train/test split
split = int(N * 0.8)
df.iloc[:split].to_csv("datasets/train.csv", index=False)
df.iloc[split:].to_csv("datasets/test.csv", index=False)
print(f"Wrote {N} rows. class counts: {dict(pd.Series(damage_class).value_counts().sort_index())}")
