"""
utils.py
--------
Utility functions for CSV parsing, data cleaning, dataset type inference,
advanced preprocessing, and response formatting.
"""

import io
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from scipy.signal import savgol_filter


def detect_dataset_type(df: pd.DataFrame) -> str:
    """
    Infer the astronomical dataset type based on column names.
    """
    cols = [c.lower() for c in df.columns]
    
    if any("flux" in c or "mag" in c or "brightness" in c for c in cols) and any("time" in c or "mjd" in c or "jd" in c for c in cols) and not any("energy" in c or "kev" in c for c in cols):
        return "Light Curve"
    elif any("snr" in c or "dm" in c or "dispersion" in c or "intensity" in c for c in cols) and any("freq" in c or "mhz" in c or "ghz" in c for c in cols):
        return "Radio/FRB Signal"
    elif any("energy" in c or "kev" in c or "photon" in c or "count" in c for c in cols):
        return "X-Ray Flux"
    elif any("wavelength" in c or "nm" in c or "angstrom" in c for c in cols) and any("intensity" in c or "flux" in c for c in cols):
        return "Spectral Data"
    elif any("temp" in c or "voltage" in c or "pressure" in c or "ra" in c or "dec" in c for c in cols):
        return "Telescope Telemetry"
    else:
        return "Generic Time-Series/Tabular"


def preprocess_data(df: pd.DataFrame, dataset_type: str) -> tuple[pd.DataFrame, StandardScaler]:
    """
    Apply advanced preprocessing:
    1. Parse timestamps.
    2. Handle missing values (interpolation/mean).
    3. Denoise specific columns using Savitzky-Golay.
    4. Normalize and scale numerical features.
    
    Returns:
        Processed DataFrame, and the fitted StandardScaler.
    """
    processed_df = df.copy()

    # 1. Handle missing values
    # For time-series like data, use linear interpolation. Otherwise, mean imputation.
    if dataset_type in ["Light Curve", "Radio/FRB Signal", "X-Ray Flux", "Telescope Telemetry", "Generic Time-Series/Tabular"]:
        processed_df = processed_df.interpolate(method="linear").bfill().ffill()
    else:
        processed_df = processed_df.fillna(processed_df.mean(numeric_only=True))

    # Identify numeric columns for further processing
    numeric_cols = processed_df.select_dtypes(include=[np.number]).columns.tolist()
    
    # 2. Denoising (apply lightly to flux/intensity columns)
    cols_to_denoise = [c for c in numeric_cols if any(x in c.lower() for x in ["flux", "intensity", "mag", "count"])]
    for col in cols_to_denoise:
        # Only denoise if there's enough data
        if len(processed_df) >= 11:
            try:
                # window length 11, polyorder 3
                window = min(11, len(processed_df) if len(processed_df) % 2 != 0 else len(processed_df) - 1)
                if window > 3:
                    processed_df[col] = savgol_filter(processed_df[col], window_length=window, polyorder=3)
            except Exception:
                pass # Fallback to raw if smoothing fails

    # 3. Scaling
    scaler = StandardScaler()
    if numeric_cols:
        processed_df[numeric_cols] = scaler.fit_transform(processed_df[numeric_cols])

    return processed_df, scaler


def create_sequences(df: pd.DataFrame, sequence_length: int = 10):
    """
    Create sequences for LSTM Autoencoder.
    """
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    data = df[numeric_cols].values
    
    sequences = []
    for i in range(len(data) - sequence_length + 1):
        sequences.append(data[i:i + sequence_length])
        
    return np.array(sequences), numeric_cols


def parse_and_clean_csv(file_bytes: bytes) -> tuple[pd.DataFrame, pd.DataFrame, str, StandardScaler]:
    """
    Parse raw CSV, infer dataset type, and preprocess it.
    
    Returns:
        Original DataFrame, Processed DataFrame, dataset_type, scaler
    """
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as e:
        raise ValueError(f"Failed to parse CSV file: {e}")

    if df.empty:
        raise ValueError("The CSV file is empty.")

    # Drop columns that are entirely NaN
    df = df.dropna(axis=1, how='all')

    if df.empty or df.shape[1] == 0:
        raise ValueError("The CSV contains no valid columns.")

    dataset_type = detect_dataset_type(df)
    
    # Check if there are numeric columns before preprocessing
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if not numeric_cols:
         raise ValueError("No numeric columns found. AI models require numeric data.")

    processed_df, scaler = preprocess_data(df, dataset_type)

    return df, processed_df, dataset_type, scaler


def dataframe_to_records(df: pd.DataFrame) -> list[dict]:
    """
    Convert a DataFrame to a list of JSON-serializable dictionaries.
    """
    df_clean = df.replace([np.inf, -np.inf], np.nan)
    records = df_clean.where(pd.notnull(df_clean), None).to_dict(orient="records")

    sanitized = []
    for record in records:
        sanitized_record = {}
        for key, value in record.items():
            if isinstance(value, (np.integer,)):
                sanitized_record[key] = int(value)
            elif isinstance(value, (np.floating,)):
                sanitized_record[key] = float(value) if not np.isnan(value) else None
            else:
                sanitized_record[key] = value
        sanitized.append(sanitized_record)

    return sanitized
