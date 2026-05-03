"""
database.py
-----------
Handles SQLite database setup and CRUD operations.
Stores analysis history: filename, anomaly count, and timestamp.
"""

import sqlite3
from datetime import datetime

# Database file path
DB_PATH = "anomaly_detection.db"


def get_connection():
    """Create and return a new database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Allows dict-like row access
    return conn


def init_db():
    """
    Initialize the database by creating the analysis_history table
    if it doesn't already exist.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            filename    TEXT    NOT NULL,
            anomaly_count INTEGER NOT NULL,
            total_rows  INTEGER NOT NULL,
            timestamp   TEXT    NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def save_analysis(filename: str, anomaly_count: int, total_rows: int):
    """
    Save a new analysis record to the database.

    Args:
        filename:      Name of the uploaded CSV file.
        anomaly_count: Number of anomalies detected.
        total_rows:    Total number of rows processed.
    """
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
    """
    Retrieve all analysis history records from the database.

    Returns:
        List of dicts with keys: id, filename, anomaly_count, total_rows, timestamp.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM analysis_history ORDER BY id DESC LIMIT 50"
    )
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows
