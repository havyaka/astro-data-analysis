"""
model.py
--------
Advanced AI Anomaly Detection Engine.
Integrates:
1. Isolation Forest (statistical ensemble)
2. Dense Autoencoder Neural Network (reconstruction)
3. LSTM Autoencoder (temporal sequence reconstruction)
4. Rule-Based Validation Engine (domain physical rules)

Saves and loads models from disk, logs training, and calculates hybrid confidence scores.
"""

import os
import pickle
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.ensemble import IsolationForest
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, RepeatVector, TimeDistributed, Input
from utils import create_sequences

# Suppress TF warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

MODELS_DIR = os.path.join("models", "saved")
os.makedirs(MODELS_DIR, exist_ok=True)


# --- 1. MODEL ARCHITECTURES ---

def build_dense_autoencoder(n_features: int) -> Sequential:
    """Build a Dense Autoencoder for tabular reconstruction."""
    model = Sequential([
        Input(shape=(n_features,)),
        Dense(64, activation='relu'),
        Dense(32, activation='relu'),
        Dense(16, activation='relu'),  # Bottleneck
        Dense(32, activation='relu'),
        Dense(64, activation='relu'),
        Dense(n_features, activation='linear')
    ])
    model.compile(optimizer='adam', loss='mse')
    return model


def build_lstm_autoencoder(sequence_length: int, n_features: int) -> Sequential:
    """Build an LSTM Autoencoder for sequence reconstruction."""
    model = Sequential([
        Input(shape=(sequence_length, n_features)),
        LSTM(64, activation='relu', return_sequences=False),
        RepeatVector(sequence_length),
        LSTM(64, activation='relu', return_sequences=True),
        TimeDistributed(Dense(n_features))
    ])
    model.compile(optimizer='adam', loss='mse')
    return model


# --- 2. RULE-BASED VALIDATION ENGINE ---

def validate_physics(df: pd.DataFrame, dataset_type: str) -> tuple[np.ndarray, list[list[str]]]:
    """
    Applies real physics-based and instrument physical rules to validate astronomical anomalies.
    Returns:
        - rule_scores: array of float scores [0, 1] representing severity of rule violations.
        - rule_flags: list of list of strings representing violated rules for each row.
    """
    n_rows = len(df)
    rule_scores = np.zeros(n_rows)
    all_flags = [[] for _ in range(n_rows)]
    cols = [c.lower() for c in df.columns]

    # Convert columns map for easy index lookup
    col_mapping = {c.lower().strip(): c for c in df.columns}

    for i in range(n_rows):
        flags = []
        row = df.iloc[i]
        
        # --- Type 1: Pulsar Stars Candidate Data ---
        if dataset_type == "Radio/FRB Signal" and "mean of the integrated profile" in cols:
            # Columns in pulsar stars:
            # - Mean of the integrated profile
            # - Mean of the DM-SNR curve
            # - Standard deviation of the DM-SNR curve
            mean_prof = row[col_mapping.get("mean of the integrated profile")]
            mean_dm = row[col_mapping.get("mean of the dm-snr curve")]
            std_dm = row[col_mapping.get("standard deviation of the dm-snr curve")]

            if mean_prof < 0:
                flags.append("NEGATIVE_INTEGRATED_PROFILE_MEAN")
            if mean_dm < 0:
                flags.append("NEGATIVE_DM_SNR_MEAN")
            if std_dm <= 0:
                flags.append("ZERO_OR_NEGATIVE_DM_SNR_STD")

        # --- Type 2: Light Curve (flux vs time) ---
        elif dataset_type == "Light Curve":
            # Search for flux columns
            flux_col = None
            for c in df.columns:
                if any(x in c.lower() for x in ["flux", "brightness", "mag"]):
                    flux_col = c
                    break
            
            if flux_col:
                flux_val = row[flux_col]
                # Physics rule: Flux cannot be negative (except in specialized difference imaging, but generally is physical count)
                if flux_val < 0:
                    flags.append("NEGATIVE_FLUX_VALUE")
                
                # Check for extreme RFI or cosmic ray hit spike (value > 6 * standard deviation)
                mean_flux = df[flux_col].mean()
                std_flux = df[flux_col].std()
                if std_flux > 0 and abs(flux_val - mean_flux) > 6 * std_flux:
                    flags.append("EXTREME_COSMIC_RAY_SPIKE")

        # --- Type 3: Telescope Telemetry (RA/Dec coordinates, Temperature, Voltage) ---
        elif dataset_type == "Telescope Telemetry":
            ra_col = col_mapping.get("ra")
            dec_col = col_mapping.get("dec")
            temp_col = col_mapping.get("temp")

            if ra_col:
                ra_val = row[ra_col]
                if ra_val < 0 or ra_val > 360:
                    flags.append("INVALID_RIGHT_ASCENSION")
            if dec_col:
                dec_val = row[dec_col]
                if dec_val < -90 or dec_val > 90:
                    flags.append("INVALID_DECLINATION")
            if temp_col:
                temp_val = row[temp_col]
                # Less than absolute zero (K) or impossible sensor range
                if temp_val < -273.15: 
                    flags.append("TEMP_BELOW_ABSOLUTE_ZERO")

        # --- Type 4: Spectral Data (Wavelength/Intensity) ---
        elif dataset_type == "Spectral Data":
            wl_col = None
            int_col = None
            for c in df.columns:
                if "wavelength" in c.lower() or "nm" in c.lower():
                    wl_col = c
                if "intensity" in c.lower() or "flux" in c.lower():
                    int_col = c
            
            if wl_col:
                wl_val = row[wl_col]
                if wl_val <= 0:
                    flags.append("NON_POSITIVE_WAVELENGTH")
            if int_col:
                int_val = row[int_col]
                if int_val < 0:
                    flags.append("NEGATIVE_SPECTRAL_INTENSITY")

        # Generic checklist for any dataset: Out of bounds nan or infinite check
        for c in df.columns:
            val = row[c]
            if pd.isna(val) or np.isinf(val):
                flags.append("NAN_OR_INFINITY_DETECTED")
                break

        # Calculate a normalized penalty score
        if flags:
            rule_scores[i] = min(1.0, len(flags) * 0.35)
            all_flags[i] = flags

    return rule_scores, all_flags


# --- 3. MODEL TRAINING & SAVING PIPELINE ---

def train_local_model(dataset_id: int, model_name: str, processed_df: pd.DataFrame, dataset_type: str, custom_params: dict = None) -> tuple[str, dict]:
    """
    Trains a model locally on preprocessed data and saves it to the disk.
    Returns:
        model_path: filepath where weights were saved.
        metrics: training stats/metrics dict.
    """
    numeric_cols = processed_df.select_dtypes(include=[np.number]).columns.tolist()
    data = processed_df[numeric_cols].values
    
    if len(data) == 0:
        raise ValueError("Cannot train model: preprocessed dataset has no numeric rows.")

    params = custom_params or {}

    if model_name == "isolation_forest":
        contamination = params.get("contamination", 0.05)
        model = IsolationForest(contamination=contamination, random_state=42)
        model.fit(data)
        
        # Save Isolation Forest
        model_path = os.path.join(MODELS_DIR, f"ds_{dataset_id}_isolation_forest.pkl")
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
            
        metrics = {
            "contamination": contamination,
            "features_trained": len(numeric_cols),
            "total_samples": len(data),
            "status": "fully_trained"
        }

    elif model_name == "autoencoder":
        epochs = params.get("epochs", 15)
        batch_size = params.get("batch_size", 32)
        
        model = build_dense_autoencoder(len(numeric_cols))
        history = model.fit(data, data, epochs=epochs, batch_size=batch_size, verbose=0, validation_split=0.1)
        
        # Save Autoencoder
        model_path = os.path.join(MODELS_DIR, f"ds_{dataset_id}_autoencoder.h5")
        model.save(model_path)
        
        final_loss = history.history['loss'][-1]
        final_val_loss = history.history.get('val_loss', [final_loss])[-1]
        
        metrics = {
            "epochs": epochs,
            "batch_size": batch_size,
            "training_loss": float(final_loss),
            "validation_loss": float(final_val_loss),
            "loss_history": [float(l) for l in history.history['loss']]
        }

    elif model_name == "lstm":
        epochs = params.get("epochs", 10)
        batch_size = params.get("batch_size", 32)
        seq_len = params.get("sequence_length", 10)
        
        # Prepare sequences
        seq_len = min(seq_len, len(data) // 3)
        if seq_len < 3:
            seq_len = 3
            
        X_seq, _ = create_sequences(processed_df, seq_len)
        
        model = build_lstm_autoencoder(seq_len, len(numeric_cols))
        history = model.fit(X_seq, X_seq, epochs=epochs, batch_size=batch_size, verbose=0, validation_split=0.1)
        
        # Save LSTM
        model_path = os.path.join(MODELS_DIR, f"ds_{dataset_id}_lstm.h5")
        model.save(model_path)
        
        final_loss = history.history['loss'][-1]
        final_val_loss = history.history.get('val_loss', [final_loss])[-1]
        
        metrics = {
            "epochs": epochs,
            "batch_size": batch_size,
            "sequence_length": seq_len,
            "training_loss": float(final_loss),
            "validation_loss": float(final_val_loss),
            "loss_history": [float(l) for l in history.history['loss']]
        }
    else:
        raise ValueError(f"Unknown model name: {model_name}")

    return model_path, metrics


# --- 4. HYBRID INFERENCE & EXPLANATION PIPELINE ---

def run_hybrid_anomaly_detection(dataset_id: int, original_df: pd.DataFrame, processed_df: pd.DataFrame, dataset_type: str) -> tuple[pd.DataFrame, list[dict], dict]:
    """
    Loads saved models (or auto-trains default ones if missing) to run hybrid anomaly scoring.
    Ensembles:
      - Isolation Forest
      - Dense Autoencoder
      - LSTM Autoencoder (if sequence compatible)
      - Physical rule violations

    Returns:
        result_df: DataFrame with 'score', 'anomaly', 'flags' columns.
        explanations: List of explanations for anomalies.
        run_summary: Summary statistics of models performance.
    """
    numeric_cols = processed_df.select_dtypes(include=[np.number]).columns.tolist()
    data = processed_df[numeric_cols].values
    n_rows = len(original_df)
    
    result_df = original_df.copy()
    
    # 1. Physical Rule Validation
    rule_scores, all_flags = validate_physics(original_df, dataset_type)
    
    # Paths to models
    if_path = os.path.join(MODELS_DIR, f"ds_{dataset_id}_isolation_forest.pkl")
    ae_path = os.path.join(MODELS_DIR, f"ds_{dataset_id}_autoencoder.h5")
    lstm_path = os.path.join(MODELS_DIR, f"ds_{dataset_id}_lstm.h5")
    
    # --- 2. Isolation Forest Scoring ---
    if os.path.exists(if_path):
        with open(if_path, 'rb') as f:
            iso_forest = pickle.load(f)
    else:
        # Auto-train default IF
        iso_forest = IsolationForest(contamination=0.05, random_state=42)
        iso_forest.fit(data)
        with open(if_path, 'wb') as f:
            pickle.dump(iso_forest, f)
            
    if_decision = iso_forest.decision_function(data)
    # Convert decision score to outlier confidence [0, 1] (decision_function is negative for anomalies)
    # Map decision function from [-0.5, 0.5] roughly to [0, 1] using logistic sigmoid
    if_scores = 1.0 / (1.0 + np.exp(if_decision * 10.0))

    # --- 3. Dense Autoencoder Scoring ---
    if os.path.exists(ae_path):
      ae_model = load_model(ae_path, compile=False)
    else:
      # Auto-train default Autoencoder
      ae_model = build_dense_autoencoder(len(numeric_cols))
      ae_model.fit(data, data, epochs=10, batch_size=32, verbose=0)
      ae_model.save(ae_path)

    ae_reconstructed = ae_model.predict(data, verbose=0)
    ae_losses = np.mean(np.square(data - ae_reconstructed), axis=1)

    # Normalize autoencoder scores relative to dynamic normal threshold
    ae_threshold = np.mean(ae_losses) + 3.0 * np.std(ae_losses)
    ae_scores = np.clip(ae_losses / (ae_threshold if ae_threshold > 0 else 1.0), 0.0, 2.0) / 2.0

    # --- 4. LSTM Sequence Autoencoder Scoring (if applicable) ---
    is_sequential = dataset_type in ["Light Curve", "Radio/FRB Signal", "Telescope Telemetry", "Generic Time-Series/Tabular"]
    lstm_scores = np.zeros(n_rows)
    lstm_active = False

    if is_sequential and len(data) >= 20:
      seq_len = min(10, len(data) // 3)
      if seq_len < 3:
        seq_len = 3

      if os.path.exists(lstm_path):
        try:
          lstm_model = load_model(lstm_path, compile=False)
          lstm_active = True
        except Exception:
          lstm_active = False
        else:
            try:
                # Auto-train default LSTM
                X_seq, _ = create_sequences(processed_df, seq_len)
                lstm_model = build_lstm_autoencoder(seq_len, len(numeric_cols))
                lstm_model.fit(X_seq, X_seq, epochs=8, batch_size=32, verbose=0)
                lstm_model.save(lstm_path)
                lstm_active = True
            except Exception:
                lstm_active = False
                
        if lstm_active:
            try:
                X_seq, _ = create_sequences(processed_df, seq_len)
                lstm_pred = lstm_model.predict(X_seq, verbose=0)
                lstm_mse = np.mean(np.square(X_seq - lstm_pred), axis=(1, 2))
                
                # Align sequence length to full size
                padding = np.zeros(seq_len - 1)
                full_lstm_mse = np.concatenate([padding, lstm_mse])
                
                lstm_threshold = np.mean(lstm_mse) + 3.0 * np.std(lstm_mse)
                lstm_scores = np.clip(full_lstm_mse / (lstm_threshold if lstm_threshold > 0 else 1.0), 0.0, 2.0) / 2.0
            except Exception:
                lstm_active = False

    # --- 5. Combine Ensemble via Weighted Hybrid Score ---
    # Adjust weights depending on whether LSTM is active
    if lstm_active:
        w_if, w_ae, w_lstm, w_rule = 0.30, 0.35, 0.20, 0.15
    else:
        w_if, w_ae, w_lstm, w_rule = 0.40, 0.40, 0.00, 0.20

    hybrid_scores = (w_if * if_scores +
                     w_ae * ae_scores +
                     w_lstm * lstm_scores +
                     w_rule * rule_scores)

    # Anomaly condition: hybrid score > 0.45 or strong agreement between models
    # Outlier threshold is set dynamically based on distribution percentile
    anomaly_threshold = np.percentile(hybrid_scores, 95)
    # Ensure outlier threshold is at least 0.40 to prevent massive false alarms
    anomaly_threshold = max(0.42, anomaly_threshold)

    predictions = np.where(hybrid_scores >= anomaly_threshold, -1, 1)

    result_df["score"] = np.round(hybrid_scores, 6)
    result_df["anomaly"] = predictions
    result_df["flags"] = [",".join(f) if f else "NORMAL" for f in all_flags]

    # --- 6. Generate Natural Language Explainable AI (XAI) Explanations ---
    explanations = []
    for i in range(n_rows):
        if predictions[i] == -1:
            # Find feature contributing most to outlier status
            means = np.mean(data, axis=0)
            stds = np.std(data, axis=0)
            z_scores = np.abs((data[i] - means) / (stds if stds.any() else 1.0))
            feature_idx = np.argmax(z_scores)
            feature_name = numeric_cols[feature_idx]
            
            # Severity mapping
            severity = "CRITICAL" if hybrid_scores[i] > 0.70 or len(all_flags[i]) >= 2 else "HIGH" if hybrid_scores[i] > 0.50 else "MODERATE"
            
            # Base message
            reason = f"Ensemble AI flag: hybrid anomaly index is {hybrid_scores[i]:.2f}. "
            reason += f"Feature '{feature_name}' shows a deviation of {z_scores[feature_idx]:.1f}σ from background distribution. "
            
            if all_flags[i]:
                reason += f"Physical rule violations: {', '.join(all_flags[i])} flagged by rule validation."
            else:
                reason += "No physical rules violated; flagged primarily by neural network reconstruction failure."

            explanations.append({
                "index": i,
                "severity": severity,
                "reason": reason,
                "score": float(np.round(hybrid_scores[i], 4)),
                "flags": all_flags[i]
            })

    run_summary = {
        "models_used": ["isolation_forest", "autoencoder"] + (["lstm"] if lstm_active else []),
        "weights": {"isolation_forest": w_if, "autoencoder": w_ae, "lstm": w_lstm, "rules": w_rule},
        "anomaly_threshold": float(anomaly_threshold),
        "active_features": numeric_cols
    }

    return result_df, explanations, run_summary
