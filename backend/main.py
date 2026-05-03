"""
main.py
-------
FastAPI application entry point.
Defines CORS, API routes, and orchestrates the anomaly detection pipeline.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import init_db, save_analysis, get_history
from model import detect_anomalies
from utils import parse_and_clean_csv, dataframe_to_records

# ---------------------------------------------------------------------------
# App initialization
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AI Anomaly Detection API",
    description="Upload a CSV and detect anomalies using Isolation Forest.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS – allow any Vite dev server port (5173-5179) + production origins
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
        "http://localhost:5176", "http://127.0.0.1:5176",
        "http://localhost:3000", "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the SQLite database on startup
@app.on_event("startup")
def startup_event():
    init_db()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "AI Anomaly Detection API is running."}


@app.post("/analyze", tags=["Analysis"])
async def analyze(file: UploadFile = File(...)):
    """
    Accept a CSV file, run Isolation Forest anomaly detection, persist the
    result summary to SQLite, and return the enriched data as JSON.

    Returns:
        {
            "data":          [...],   # rows with 'anomaly' and 'score' columns
            "anomaly_count": int,
            "total_rows":    int,
            "columns":       [...],
            "message":       str
        }
    """
    # Validate file type
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    # Read uploaded file bytes
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    try:
        # 1. Parse, infer type & clean the CSV
        original_df, processed_df, dataset_type, scaler = parse_and_clean_csv(contents)

        # 2. Run authentic AI anomaly detection (LSTM or Ensemble)
        result_df, explanations = detect_anomalies(original_df, processed_df, dataset_type, scaler)

        # 3. Count anomalies
        anomaly_count = int((result_df["anomaly"] == -1).sum())
        total_rows = len(result_df)

        # 4. Persist to database
        save_analysis(
            filename=file.filename,
            anomaly_count=anomaly_count,
            total_rows=total_rows,
        )

        # 5. Build JSON-safe records
        records = dataframe_to_records(result_df)

        message = (
            f"[!] {anomaly_count} genuine anomalie(s) detected using AI inference!"
            if anomaly_count > 0
            else "[OK] Data looks mathematically normal - no anomalies found by AI."
        )

        return JSONResponse(content={
            "data": records,
            "anomaly_count": anomaly_count,
            "total_rows": total_rows,
            "columns": result_df.columns.tolist(),
            "message": message,
            "dataset_type": dataset_type,
            "explanations": explanations
        })

    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {exc}")


@app.get("/history", tags=["History"])
def history():
    """Return the last 50 analysis records stored in SQLite."""
    try:
        records = get_history()
        return {"history": records}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
