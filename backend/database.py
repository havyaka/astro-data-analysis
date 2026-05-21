"""
database.py
-----------
Handles SQLite database setup and CRUD operations.
Stores datasets metadata, predictions history, training sessions, alerts, and live feed tickers.
"""

import sqlite3
import json
import os
from datetime import datetime

DB_PATH = "anomaly_detection.db"
UPLOAD_DIR = os.path.join("dataset", "uploads")
PROCESSED_DIR = os.path.join("dataset", "processed")
MODELS_DIR = os.path.join("models", "saved")

# Ensure necessary directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)


def get_connection():
    """Create and return a new database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Allows dict-like row access
    return conn


def init_db():
    """
    Initialize the database by creating all needed tables.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Backwards compatible analysis history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_history (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            filename      TEXT    NOT NULL,
            anomaly_count INTEGER NOT NULL,
            total_rows    INTEGER NOT NULL,
            timestamp     TEXT    NOT NULL
        )
    """)

    # 2. Datasets table to keep track of permanently saved files
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS datasets (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            name               TEXT    NOT NULL,
            filepath           TEXT    NOT NULL,
            processed_filepath TEXT    NOT NULL,
            dataset_type       TEXT    NOT NULL,
            total_rows         INTEGER NOT NULL,
            features           TEXT    NOT NULL,  -- Comma-separated feature names
            uploaded_at        TEXT    NOT NULL
        )
    """)

    # 3. Predictions table to save detailed model runs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            dataset_id      INTEGER NOT NULL,
            timestamp       TEXT    NOT NULL,
            total_anomalies INTEGER NOT NULL,
            results_json    TEXT    NOT NULL,  -- Holds detailed predictions list
            FOREIGN KEY(dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
        )
    """)

    # 4. Training sessions table to log local weights & logs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS training_sessions (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            dataset_id     INTEGER NOT NULL,
            model_name     TEXT    NOT NULL,  -- 'isolation_forest', 'autoencoder', 'lstm'
            timestamp      TEXT    NOT NULL,
            status         TEXT    NOT NULL,  -- 'completed', 'failed'
            metrics_json   TEXT    NOT NULL,  -- MSE, Accuracy, precision, recall, training loss history
            model_filepath TEXT    NOT NULL,  -- Location of local pkl or h5 file
            FOREIGN KEY(dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
        )
    """)

    # 5. Alerts table to replace active mock alert items
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id          TEXT PRIMARY KEY,  -- ALT-xxxx
            level       TEXT NOT NULL,     -- CRITICAL, HIGH, MODERATE, LOW
            type        TEXT NOT NULL,     -- FRB, Transient, Anomaly, Spectral, X-Ray, Noise
            title       TEXT NOT NULL,
            timestamp   TEXT NOT NULL,     -- relative/absolute timestamp
            scope       TEXT NOT NULL,     -- telescope name
            confidence  REAL NOT NULL,     -- model score
            action      TEXT NOT NULL      -- recommendation action
        )
    """)

    # 6. Live Feed table for Mission Control real-time logs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS live_feed (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            type      TEXT NOT NULL,  -- FRB, AI, Scope, Alert, Catalog
            msg       TEXT NOT NULL,
            severity  TEXT NOT NULL   -- high, medium, info
        )
    """)

    # No seed data is inserted.
    # alerts and live_feed tables start completely empty.
    # All entries are generated exclusively from real ML inference runs on user-uploaded datasets.

    conn.commit()
    conn.close()


def save_analysis(filename: str, anomaly_count: int, total_rows: int):
    """Save analysis record (retained for backward compatibility)."""
    conn = get_connection()
    cursor = conn.cursor()
    timestamp = datetime.utcnow().isoformat()
    cursor.execute(
        """
        INSERT INTO analysis_history (filename, anomaly_count, total_rows, timestamp)
        VALUES (?, ?, ?, ?)
        """,
        (filename, anomaly_count, total_rows, timestamp),
    )
    conn.commit()
    conn.close()


def get_history():
    """Retrieve backwards-compatible analysis history."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis_history ORDER BY id DESC LIMIT 50")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


# --- DATASET CRUD Operations ---

def add_dataset(name: str, filepath: str, processed_filepath: str, dataset_type: str, total_rows: int, features: list) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    uploaded_at = datetime.utcnow().isoformat()
    features_str = ",".join(features)
    cursor.execute("""
        INSERT INTO datasets (name, filepath, processed_filepath, dataset_type, total_rows, features, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (name, filepath, processed_filepath, dataset_type, total_rows, features_str, uploaded_at))
    dataset_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return dataset_id


def get_datasets() -> list[dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM datasets ORDER BY id DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def get_dataset(dataset_id: int) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def delete_dataset(dataset_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    # Also fetch files to delete them from physical disk
    cursor.execute("SELECT filepath, processed_filepath FROM datasets WHERE id = ?", (dataset_id,))
    row = cursor.fetchone()
    if row:
        try:
            if os.path.exists(row['filepath']):
                os.remove(row['filepath'])
            if os.path.exists(row['processed_filepath']):
                os.remove(row['processed_filepath'])
        except Exception:
            pass
    cursor.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
    conn.commit()
    conn.close()


# --- PREDICTIONS AND TRAINING Operations ---

def add_prediction(dataset_id: int, total_anomalies: int, results: list) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    timestamp = datetime.utcnow().isoformat()
    results_json = json.dumps(results)
    cursor.execute("""
        INSERT INTO predictions (dataset_id, timestamp, total_anomalies, results_json)
        VALUES (?, ?, ?, ?)
    """, (dataset_id, timestamp, total_anomalies, results_json))
    pred_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return pred_id


def get_prediction_history() -> list[dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.id, p.dataset_id, d.name as dataset_name, d.dataset_type, p.timestamp, p.total_anomalies, d.total_rows
        FROM predictions p
        JOIN datasets d ON p.dataset_id = d.id
        ORDER BY p.id DESC LIMIT 50
    """)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def get_prediction_details(prediction_id: int) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.id, p.dataset_id, d.name as dataset_name, d.dataset_type, p.timestamp, p.total_anomalies, p.results_json
        FROM predictions p
        JOIN datasets d ON p.dataset_id = d.id
        WHERE p.id = ?
    """, (prediction_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        data = dict(row)
        data['results'] = json.loads(data['results_json'])
        del data['results_json']
        return data
    return None


def add_training_session(dataset_id: int, model_name: str, status: str, metrics: dict, model_filepath: str) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    timestamp = datetime.utcnow().isoformat()
    metrics_json = json.dumps(metrics)
    cursor.execute("""
        INSERT INTO training_sessions (dataset_id, model_name, timestamp, status, metrics_json, model_filepath)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (dataset_id, model_name, timestamp, status, metrics_json, model_filepath))
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return session_id


def get_model_status() -> list[dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ts.id, ts.dataset_id, d.name as dataset_name, ts.model_name, ts.timestamp, ts.status, ts.metrics_json, ts.model_filepath
        FROM training_sessions ts
        JOIN datasets d ON ts.dataset_id = d.id
        ORDER BY ts.id DESC
    """)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    for row in rows:
        row['metrics'] = json.loads(row['metrics_json'])
        del row['metrics_json']
    return rows


# --- ALERTS AND FEED Operations ---

def get_alerts() -> list[dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY id DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def add_alert(alert_id: str, level: str, alert_type: str, title: str, timestamp: str, scope: str, confidence: float, action: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO alerts (id, level, type, title, timestamp, scope, confidence, action)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (alert_id, level, alert_type, title, timestamp, scope, confidence, action))
    conn.commit()
    conn.close()


def get_live_feed() -> list[dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM live_feed ORDER BY id DESC LIMIT 50")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def add_feed_item(timestamp: str, feed_type: str, msg: str, severity: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO live_feed (timestamp, type, msg, severity)
        VALUES (?, ?, ?, ?)
    """, (timestamp, feed_type, msg, severity))
    conn.commit()
    conn.close()


# --- DASHBOARD STATS Operations ---

def get_dashboard_stats() -> dict:
    conn = get_connection()
    cursor = conn.cursor()

    # Total datasets
    cursor.execute("SELECT COUNT(*) FROM datasets")
    total_datasets = cursor.fetchone()[0]

    # Total predictions/runs
    cursor.execute("SELECT COUNT(*) FROM predictions")
    total_runs = cursor.fetchone()[0]

    # Total anomalies and events analyzed
    cursor.execute("SELECT SUM(total_anomalies) FROM predictions")
    total_anomalies = cursor.fetchone()[0] or 0

    cursor.execute("SELECT SUM(total_rows) FROM datasets")
    total_rows = cursor.fetchone()[0] or 0

    # Number of trained models
    cursor.execute("SELECT COUNT(DISTINCT model_name) FROM training_sessions WHERE status = 'completed'")
    models_running = cursor.fetchone()[0]

    # Alerts count
    cursor.execute("SELECT COUNT(*) FROM alerts")
    alerts_today = cursor.fetchone()[0]

    conn.close()

    return {
        "uptime": "100% (Local)",
        "totalEvents": total_rows,
        "totalDatasets": total_datasets,
        "frbCandidates": total_datasets,
        "anomaliesDetected": total_anomalies,
        "activeScopes": 0,
        "aiModelsRunning": models_running,
        "alertsToday": alerts_today
    }
