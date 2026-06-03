# Predictive Structural Health Monitoring using Machine Learning and Explainable AI

## Installation and Running Guide

### Prerequisites

Before running the project, ensure the following software is installed:

* Python 3.10 or higher
* Node.js (v18 or later recommended)
* npm
* Visual Studio Code

---

# Project Structure

```text
pulse-sentinel-ml/
│
├── backend/
│   └── run_pipeline.py
│
├── datasets/
│   └── structure_data.csv
│
├── src/
│   ├── data/
│   ├── routes/
│   ├── components/
│   ├── lib/
│   └── ...
│
├── package.json
├── vite.config.ts
└── ...
```

---

# Step 1: Open Project in VS Code

Open Visual Studio Code.

Select:

```text
File → Open Folder
```

Choose:

```text
pulse-sentinel-ml
```

Open the integrated terminal:

```text
Terminal → New Terminal
```

or

```text
Ctrl + `
```

---

# Step 2: Install Frontend Dependencies

From the project root directory, run:

```bash
npm install
```

This installs all React, Vite, TanStack Router, Recharts, and frontend dependencies required by the dashboard.

Wait until installation completes successfully.

---

# Step 3: Place Dataset

Copy the Structural Health Monitoring dataset into:

```text
datasets/
```

The dataset file should be named:

```text
structure_data.csv
```

Final location:

```text
datasets/structure_data.csv
```

---

# Step 4: Install Python Dependencies

Install the required Python libraries:

```bash
pip install pandas numpy scikit-learn xgboost shap
```

Verify installation:

```bash
python -c "import pandas, numpy, sklearn, xgboost, shap; print('All packages installed successfully')"
```

---

# Step 5: Generate Dashboard Data

Run the Machine Learning pipeline:

```bash
python backend/run_pipeline.py
```

Expected output:

```text
rows: 43200 after dropna: 31232

wrote analysis.json
wrote anomaly.json
wrote damage.json
wrote shap.json
wrote health.json
wrote recommendations.json
wrote series.json

DONE
```

This step:

* Loads the dataset
* Cleans missing values
* Runs Isolation Forest
* Trains XGBoost
* Generates SHAP explanations
* Calculates health score
* Performs risk assessment
* Generates maintenance recommendations
* Creates dashboard JSON files

Generated files are stored in:

```text
src/data/
```

---

# Step 6: Start Dashboard

Run:

```bash
npm run dev
```

Expected output:

```text
VITE vX.X.X ready in XXX ms

➜ Local: http://localhost:3000/
```

or

```text
➜ Local: http://localhost:5173/
```

depending on Vite version.

Open the displayed URL in a browser.

---

# Dashboard Pages

## Dashboard

Provides an overview of:

* Total records
* Clean records
* Health score
* Risk level
* Number of anomalies

---

## Data Analysis

Displays:

* Statistical summary
* Correlation matrix
* Dataset preview

---

## Anomaly Detection

Displays:

* Isolation Forest results
* Anomaly count
* Anomaly percentage
* Time-series anomaly visualization

---

## Damage Assessment

Displays:

* XGBoost classification results
* Damage class distribution
* Accuracy
* Precision
* Recall
* F1-score

---

## Explainable AI (SHAP)

Displays:

* Global feature importance
* Waterfall plot
* Feature contribution table
* Prediction explanation

---

## Recommendations

Displays:

* Risk assessment
* Maintenance suggestions
* Structural health insights

---

# Machine Learning Pipeline

The complete workflow is:

```text
Dataset
   ↓
Data Cleaning
   ↓
Feature Selection
   ↓
Isolation Forest
   ↓
Anomaly Detection
   ↓
XGBoost Classification
   ↓
Damage Prediction
   ↓
SHAP Explainability
   ↓
Health Score Calculation
   ↓
Risk Assessment
   ↓
Maintenance Recommendations
   ↓
Dashboard Visualization
```

---

# Important Notes

The project uses a real Structural Health Monitoring dataset.

No synthetic data generation is required.


```text
backend/run_pipeline.py
```

Every time the dataset is updated:

1. Replace the CSV file.
2. Run:

```bash
python backend/run_pipeline.py
```

3. Refresh the dashboard.

---

# Troubleshooting

## Frontend does not start

Run:

```bash
npm install
```

again.

Then:

```bash
npm run dev
```

---

## Dataset not found

Ensure:

```text
datasets/structure_data.csv
```

exists.

---

## JSON Parsing Errors

Delete old JSON files:

```text
src/data/*.json
```

Run:

```bash
python backend/run_pipeline.py
```

again.

---

## Missing Python Libraries

Install:

```bash
pip install pandas numpy scikit-learn xgboost shap
```

---

# Project Authors

Project Title:

Predictive Structural Health Monitoring using Machine Learning and Explainable AI

Technologies Used:

* Python
* Pandas
* NumPy
* Scikit-Learn
* XGBoost
* SHAP
* React
* TypeScript
* Vite
* TanStack Router
* Recharts
