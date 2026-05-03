# 🧠 AI Anomaly Detection System

A full-stack web application that detects anomalies in CSV datasets using **Isolation Forest** (scikit-learn).

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Recharts |
| Backend | FastAPI + Uvicorn |
| Database | SQLite |
| ML | scikit-learn · pandas · numpy |

---

## 📁 Project Structure

```
root/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx            ← Root component
│       ├── App.module.css
│       ├── main.jsx
│       ├── index.css          ← Global design system
│       ├── components/
│       │   ├── FileUpload.jsx        ← Drag-and-drop CSV uploader
│       │   ├── FileUpload.module.css
│       │   ├── ResultsTable.jsx      ← Paginated, sortable table
│       │   ├── ResultsTable.module.css
│       │   ├── ChartView.jsx         ← Scatter plot (Recharts)
│       │   └── ChartView.module.css
│       └── services/
│           └── api.js          ← Axios API layer
│
├── backend/
│   ├── main.py         ← FastAPI app + routes
│   ├── database.py     ← SQLite setup & queries
│   ├── model.py        ← Isolation Forest wrapper
│   ├── utils.py        ← CSV parsing & cleaning
│   └── requirements.txt
│
└── README.md
```

---

## 🚀 Setup & Running

### Prerequisites

- **Node.js** 18+ and **npm**
- **Python** 3.10+

---

### Backend

```bash
# 1. Navigate to the backend directory
cd backend

# 2. (Recommended) Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

---

### Frontend

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install npm packages
npm install

# 3. Start the Vite dev server
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/`       | Health check |
| `POST` | `/analyze`| Upload CSV and run anomaly detection |
| `GET`  | `/history`| Fetch last 50 analysis records |

### POST `/analyze`

**Request:** `multipart/form-data` with field `file` (CSV)

**Response:**
```json
{
  "data": [
    { "col1": 1.0, "col2": 2.5, "anomaly": 1, "score": 0.0821 },
    { "col1": 99.9, "col2": -50.0, "anomaly": -1, "score": -0.1243 }
  ],
  "anomaly_count": 1,
  "total_rows": 2,
  "columns": ["col1", "col2", "anomaly", "score"],
  "message": "⚠️ 1 anomaly(ies) detected!"
}
```

- `anomaly`: **-1** = anomaly, **1** = normal
- `score`: Raw Isolation Forest decision score (lower = more anomalous)

---

## 📊 Example Dataset Format

Your CSV must have at least one numeric column. Non-numeric columns (like IDs or labels) are preserved for display but not used as ML features.

```csv
temperature,pressure,vibration,machine_id
72.1,101.3,0.12,M01
73.4,102.1,0.11,M02
71.8,100.9,0.13,M03
200.5,50.0,5.60,M04
72.9,101.7,0.12,M05
```

In the example above, row 4 (`M04`) would likely be flagged as an anomaly due to extreme values.

### Generating a synthetic test dataset

```python
import pandas as pd
import numpy as np

rng = np.random.default_rng(42)
n = 200

df = pd.DataFrame({
    "temperature": rng.normal(72, 2, n),
    "pressure":    rng.normal(101, 1, n),
    "vibration":   rng.normal(0.12, 0.02, n),
})

# Inject 5 anomalies
for i in [10, 50, 100, 150, 190]:
    df.loc[i, "temperature"] = rng.uniform(150, 200)
    df.loc[i, "pressure"]    = rng.uniform(40, 60)

df.to_csv("test_dataset.csv", index=False)
print("test_dataset.csv created!")
```

---

## ⚙️ Configuration

| Setting | Value | Location |
|---------|-------|----------|
| Backend URL | `http://localhost:8000` | `frontend/src/services/api.js` |
| Vite dev port | `5173` | `frontend/vite.config.js` |
| DB file | `anomaly_detection.db` | `backend/database.py` |
| Contamination | `0.1` (10%) | `backend/model.py` |

---

## 🔧 Troubleshooting

**CORS error in browser?**  
Make sure the FastAPI server is running on port 8000 and `allow_origins` in `backend/main.py` includes your frontend URL.

**"No numeric columns found"?**  
Ensure your CSV has at least one column with numeric data (integers or floats).

**Model takes too long?**  
Reduce `n_estimators` in `backend/model.py` or set `contamination` to a smaller value.

---

## 📝 License

MIT – free to use and modify.
