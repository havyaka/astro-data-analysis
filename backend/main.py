"""
main.py
-------
FastAPI entrypoint.
Defines REST API endpoints for multi-modal dataset uploads, local model training,
real-time hybrid ensembled inference, history logs, database telemetry, alerts, and feeds.
"""

import os
import shutil
import numpy as np
import pandas as pd
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import database
from model import train_local_model, run_hybrid_anomaly_detection
from utils import parse_and_clean_csv, dataframe_to_records

# Initialize database tables on startup
database.init_db()

app = FastAPI(
    title="AI-Powered Astronomical Anomaly Detection System",
    description="Completely offline astronomical anomaly detection and model manager.",
    version="2.0.0",
)

# Allow CORS for dev and standard local environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:8080", "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["System"])
def root():
    """Health check endpoint."""
    return {"status": "online", "system": "AI-Powered Astronomical Observatory Platform"}


# --- 1. DATASETS ENDPOINTS ---

@app.post("/datasets/upload", tags=["Datasets"])
async def upload_dataset(file: UploadFile = File(...)):
    """
    Ingests and preprocesses an astronomical CSV dataset, saving it permanently.
    Saves original CSV in dataset/uploads/ and processed/scaled CSV in dataset/processed/.
    Saves metadata in SQLite.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    # Read uploaded bytes
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        # Parse, clean, scale, and infer type
        original_df, processed_df, dataset_type, scaler = parse_and_clean_csv(contents)
        
        # Paths
        orig_filename = f"orig_{int(pd.Timestamp.now().timestamp())}_{file.filename}"
        proc_filename = f"proc_{int(pd.Timestamp.now().timestamp())}_{file.filename}"
        
        orig_path = os.path.join(database.UPLOAD_DIR, orig_filename)
        proc_path = os.path.join(database.PROCESSED_DIR, proc_filename)
        
        # Save files to disk
        original_df.to_csv(orig_path, index=False)
        processed_df.to_csv(proc_path, index=False)
        
        # Insert metadata into SQLite
        features = original_df.select_dtypes(include=[float, int]).columns.tolist()
        dataset_id = database.add_dataset(
            name=file.filename,
            filepath=orig_path,
            processed_filepath=proc_path,
            dataset_type=dataset_type,
            total_rows=len(original_df),
            features=features
        )

        # Log action to live feed
        database.add_feed_item(
            timestamp=pd.Timestamp.now().strftime("%H:%M:%S"),
            feed_type="Scope",
            msg=f"Ingested new {dataset_type} dataset: '{file.filename}' ({len(original_df)} rows)",
            severity="info"
        )

        return {
            "status": "success",
            "dataset_id": dataset_id,
            "name": file.filename,
            "dataset_type": dataset_type,
            "total_rows": len(original_df),
            "features": features,
            "message": f"Dataset '{file.filename}' successfully ingested and preprocessed."
        }

    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process dataset: {str(exc)}")


@app.get("/datasets", tags=["Datasets"])
def list_datasets():
    """Returns a list of all permanently stored datasets."""
    return database.get_datasets()


@app.get("/datasets/{dataset_id}", tags=["Datasets"])
def get_dataset_details(dataset_id: int):
    """Returns metadata and preview rows for original and processed data."""
    ds = database.get_dataset(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        orig_df = pd.read_csv(ds['filepath'])
        proc_df = pd.read_csv(ds['processed_filepath'])
        
        # Preview first 50 rows
        orig_preview = dataframe_to_records(orig_df.head(50))
        proc_preview = dataframe_to_records(proc_df.head(50))
        
        return {
            "metadata": ds,
            "original_preview": orig_preview,
            "processed_preview": proc_preview
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load dataset files: {e}")


@app.delete("/datasets/{dataset_id}", tags=["Datasets"])
def remove_dataset(dataset_id: int):
    """Deletes a dataset physically from the disk and removes database logs (CASCADE)."""
    ds = database.get_dataset(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    database.delete_dataset(dataset_id)
    
    database.add_feed_item(
        timestamp=pd.Timestamp.now().strftime("%H:%M:%S"),
        feed_type="Scope",
        msg=f"Deleted dataset '{ds['name']}' from observatory archives",
        severity="info"
    )
    
    return {"status": "success", "message": f"Dataset '{ds['name']}' completely deleted."}


# --- 2. LOCAL MODEL TRAINING ENDPOINTS ---

@app.post("/datasets/{dataset_id}/train", tags=["Model Retraining"])
def train_model(dataset_id: int, model_name: str = Query(..., description="isolation_forest, autoencoder, or lstm"), epochs: Optional[int] = None, batch_size: Optional[int] = None, sequence_length: Optional[int] = None, contamination: Optional[float] = None):
    """
    Manually triggers local offline training/retraining of a model on a selected dataset.
    Saves trained parameters to disk and logs session.
    """
    ds = database.get_dataset(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        proc_df = pd.read_csv(ds['processed_filepath'])
        
        custom_params = {}
        if epochs: custom_params["epochs"] = epochs
        if batch_size: custom_params["batch_size"] = batch_size
        if sequence_length: custom_params["sequence_length"] = sequence_length
        if contamination: custom_params["contamination"] = contamination

        # Train model locally
        model_path, metrics = train_local_model(
            dataset_id=dataset_id,
            model_name=model_name,
            processed_df=proc_df,
            dataset_type=ds['dataset_type'],
            custom_params=custom_params
        )

        # Save training session in SQLite
        database.add_training_session(
            dataset_id=dataset_id,
            model_name=model_name,
            status="completed",
            metrics=metrics,
            model_filepath=model_path
        )

        # Log to live feed
        database.add_feed_item(
            timestamp=pd.Timestamp.now().strftime("%H:%M:%S"),
            feed_type="AI",
            msg=f"Retrained '{model_name}' on '{ds['name']}'. Training metrics recorded.",
            severity="medium"
        )

        return {
            "status": "success",
            "model_name": model_name,
            "dataset_name": ds['name'],
            "metrics": metrics,
            "model_path": model_path
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Log failed session
        database.add_training_session(
            dataset_id=dataset_id,
            model_name=model_name,
            status="failed",
            metrics={"error": str(e)},
            model_filepath=""
        )
        raise HTTPException(status_code=500, detail=f"Training failed: {e}")


# --- 3. HYBRID ANALYSES & PREDICTIONS ENDPOINTS ---

@app.post("/datasets/{dataset_id}/analyze", tags=["Inference Engine"])
def analyze_dataset(dataset_id: int):
    """
    Runs the full local hybrid anomaly detection engine on the dataset.
    Loads trained models, validates physics rules, computes ensembled scores,
    and returns a summary, predictions, and natural language explanations.
    """
    ds = database.get_dataset(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        orig_df = pd.read_csv(ds['filepath'])
        proc_df = pd.read_csv(ds['processed_filepath'])

        # Run hybrid detection
        result_df, explanations, summary = run_hybrid_anomaly_detection(
            dataset_id=dataset_id,
            original_df=orig_df,
            processed_df=proc_df,
            dataset_type=ds['dataset_type']
        )

        anomaly_count = int((result_df["anomaly"] == -1).sum())
        total_rows = len(result_df)

        # Save prediction run in SQLite
        pred_records = result_df.to_dict(orient="records")
        database.add_prediction(
            dataset_id=dataset_id,
            total_anomalies=anomaly_count,
            results=pred_records
        )

        # Save to backwards compatible table as well
        database.save_analysis(
            filename=ds['name'],
            anomaly_count=anomaly_count,
            total_rows=total_rows
        )

        # Post-analysis updates: generate live feed / alert logs based on results
        now_time = pd.Timestamp.now().strftime("%H:%M:%S")
        database.add_feed_item(
            timestamp=now_time,
            feed_type="AI",
            msg=f"Completed hybrid inference on '{ds['name']}'. Found {anomaly_count} outliers.",
            severity="high" if anomaly_count > 0 else "info"
        )

        # If significant anomalies exist, trigger dynamic physical alerts
        if anomaly_count > 0:
            # Sort explanations to find highest severity anomaly
            crit_anomalies = [x for x in explanations if x['severity'] in ["CRITICAL", "HIGH"]]
            
            for idx, a in enumerate(crit_anomalies[:3]):  # Limit to logging top 3 severe alert profiles
                alert_id = f"ALT-{1000 + int(pd.Timestamp.now().timestamp() % 9000) + idx}"
                level = a['severity']
                title = f"AI Outlier: {a['reason'][:50]}..."
                scope = "LOCAL_HYBRID_OBSERVATORY"
                confidence = a['score']
                
                # Assign actionable follow up based on physical rules flagged
                action = "immediate_followup" if level == "CRITICAL" else "schedule_toa"
                if a.get('flags'):
                    action = "sensor_recalibration" if "NEGATIVE_FLUX_VALUE" in a['flags'] else "spectral_analysis"

                database.add_alert(
                    alert_id=alert_id,
                    level=level,
                    alert_type="Anomaly" if ds['dataset_type'] == "Light Curve" else ds['dataset_type'],
                    title=title,
                    timestamp="Just now",
                    scope=scope,
                    confidence=confidence,
                    action=action
                )

                # Push to live feed
                database.add_feed_item(
                    timestamp=now_time,
                    feed_type="Alert",
                    msg=f"Dispatched {level} alert: '{title}'",
                    severity="high"
                )

        records = dataframe_to_records(result_df)

        message = (
            f"[!] Detected {anomaly_count} anomalies using local hybrid model ensemble."
            if anomaly_count > 0
            else "[OK] No anomalies found by local model ensemble."
        )

        return {
            "status": "success",
            "data": records,
            "anomaly_count": anomaly_count,
            "total_rows": total_rows,
            "columns": result_df.columns.tolist(),
            "message": message,
            "dataset_type": ds['dataset_type'],
            "explanations": explanations,
            "model_summary": summary
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")


@app.get("/history", tags=["Inference Engine"])
def get_prediction_history():
    """Returns the list of past hybrid prediction runs."""
    return {"history": database.get_prediction_history()}


@app.get("/history/{prediction_id}", tags=["Inference Engine"])
def get_prediction_run_details(prediction_id: int):
    """Returns the comprehensive row-by-row prediction results of a past run."""
    details = database.get_prediction_details(prediction_id)
    if not details:
        raise HTTPException(status_code=404, detail="Prediction run not found.")
    return details


# --- 4. OBSERVATORY TELEMETRY, ALERTS & FEEDS ---

@app.get("/dashboard/stats", tags=["Observatory Core"])
def get_telemetry_stats():
    """Returns real stats from SQLite to drive the React frontend Mission Control Dashboard."""
    return database.get_dashboard_stats()


@app.get("/alerts", tags=["Observatory Core"])
def get_observatory_alerts():
    """Returns list of verified alerts recorded in the database."""
    return database.get_alerts()


@app.get("/live-feed", tags=["Observatory Core"])
def get_observatory_live_feed():
    """Returns the log feed for the dashboard live ticker."""
    return database.get_live_feed()


@app.get("/models/status", tags=["Model Retraining"])
def get_models_status():
    """Returns training records and metrics for each local model saved."""
    return database.get_model_status()


# --- 5. COMPATIBILITY / BACKWARD SUPPORT ---

@app.post("/analyze", tags=["Backward Compatibility"])
async def backward_analyze(file: UploadFile = File(...)):
    """
    Accepts raw CSV upload, auto-processes it instantly, runs detection,
    and returns response matching original API schema.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    contents = await file.read()
    try:
        original_df, processed_df, dataset_type, scaler = parse_and_clean_csv(contents)
        
        # Temp save dataset in DB to align with model path constraints
        dataset_id = database.add_dataset(
            name=file.filename,
            filepath="temp_file.csv",
            processed_filepath="temp_file_proc.csv",
            dataset_type=dataset_type,
            total_rows=len(original_df),
            features=original_df.select_dtypes(include=[np.number]).columns.tolist()
        )
        
        result_df, explanations, summary = run_hybrid_anomaly_detection(
            dataset_id=dataset_id,
            original_df=original_df,
            processed_df=processed_df,
            dataset_type=dataset_type
        )
        
        anomaly_count = int((result_df["anomaly"] == -1).sum())
        total_rows = len(result_df)
        
        database.save_analysis(file.filename, anomaly_count, total_rows)
        records = dataframe_to_records(result_df)
        
        # Clean up temp dataset
        database.delete_dataset(dataset_id)
        
        return JSONResponse(content={
            "data": records,
            "anomaly_count": anomaly_count,
            "total_rows": total_rows,
            "columns": result_df.columns.tolist(),
            "message": f"Successfully completed ensembled inference. Detected {anomaly_count} anomalies.",
            "dataset_type": dataset_type,
            "explanations": explanations
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
