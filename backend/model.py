"""
model.py
--------
Advanced AI Anomaly Detection Engine using LSTM Autoencoders, Isolation Forest,
and One-Class SVM. Provides authentic anomaly scoring and natural language explanations.
"""

import pandas as pd
import numpy as np
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # suppress TF warnings

from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, RepeatVector, TimeDistributed, Input
from utils import create_sequences

def build_lstm_autoencoder(sequence_length, n_features):
    model = Sequential([
        Input(shape=(sequence_length, n_features)),
        LSTM(64, activation='relu', return_sequences=False),
        RepeatVector(sequence_length),
        LSTM(64, activation='relu', return_sequences=True),
        TimeDistributed(Dense(n_features))
    ])
    model.compile(optimizer='adam', loss='mse')
    return model

def detect_anomalies(original_df: pd.DataFrame, processed_df: pd.DataFrame, dataset_type: str, scaler) -> tuple[pd.DataFrame, list[dict]]:
    """
    Run authentic anomaly detection using ML/DL models.
    """
    numeric_cols = processed_df.select_dtypes(include=[np.number]).columns.tolist()
    data = processed_df[numeric_cols].values
    
    result_df = original_df.copy()
    explanations = []
    
    # Check if the dataset is time-series compatible for LSTM
    is_sequential = dataset_type in ["Light Curve", "Radio/FRB Signal", "Telescope Telemetry", "Generic Time-Series/Tabular"]
    
    if is_sequential and len(data) >= 30:
        # -----------------------------
        # PRIMARY MODEL: LSTM Autoencoder
        # -----------------------------
        seq_len = min(10, len(data) // 3)
        X_seq, _ = create_sequences(processed_df, seq_len)
        
        # Train on-the-fly (in a real prod scenario, we'd use a pre-trained model for the specific dataset type)
        # Here we train briefly to learn the "normal" baseline of the current file
        model = build_lstm_autoencoder(seq_len, len(numeric_cols))
        model.fit(X_seq, X_seq, epochs=5, batch_size=32, verbose=0, validation_split=0.1)
        
        X_pred = model.predict(X_seq, verbose=0)
        # Calculate MAE loss
        mse = np.mean(np.power(X_seq - X_pred, 2), axis=(1, 2))
        
        # Pad the beginning to match original length
        padding = np.zeros(seq_len - 1)
        anomaly_scores = np.concatenate([padding, mse])
        
        # Dynamic Thresholding: mean + 3*std
        threshold = np.mean(mse) + 3 * np.std(mse)
        predictions = np.where(anomaly_scores > threshold, -1, 1)
        
        result_df["score"] = np.round(anomaly_scores, 6)
        result_df["anomaly"] = predictions
        
        # Generate Explanations
        for i in range(len(result_df)):
            if predictions[i] == -1:
                severity = "CRITICAL" if anomaly_scores[i] > threshold * 1.5 else "HIGH"
                feature_idx = np.argmax(np.abs(X_seq[max(0, i-seq_len+1)] - X_pred[max(0, i-seq_len+1)])[-1])
                feature_name = numeric_cols[feature_idx]
                explanations.append({
                    "index": i,
                    "severity": severity,
                    "reason": f"Anomaly detected due to sudden reconstruction failure in '{feature_name}'. The learned temporal variability threshold was exceeded."
                })

    else:
        # -----------------------------
        # ADDITIONAL MODELS: Isolation Forest & One-Class SVM Ensemble
        # -----------------------------
        iso_forest = IsolationForest(contamination=0.05, random_state=42)
        svm = OneClassSVM(nu=0.05, kernel="rbf", gamma="auto")
        
        iso_preds = iso_forest.fit_predict(data)
        svm_preds = svm.fit_predict(data)
        
        iso_scores = iso_forest.decision_function(data)
        svm_scores = svm.score_samples(data)
        
        # Ensemble logic: Anomaly if both agree, or if one is very confident
        predictions = np.where((iso_preds == -1) & (svm_preds == -1), -1, 1)
        
        # Combine scores for visualization (normalize them)
        iso_norm = (iso_scores - np.mean(iso_scores)) / np.std(iso_scores)
        svm_norm = (svm_scores - np.mean(svm_scores)) / np.std(svm_scores)
        combined_scores = -1 * (iso_norm + svm_norm) / 2 # Negative because lower is more anomalous in sklearn
        
        result_df["score"] = np.round(combined_scores, 6)
        result_df["anomaly"] = predictions
        
        threshold = np.percentile(combined_scores, 95) # Top 5% most anomalous
        
        for i in range(len(result_df)):
            if predictions[i] == -1:
                severity = "MODERATE" if combined_scores[i] < threshold else "HIGH"
                # Find most deviating feature
                means = np.mean(data, axis=0)
                stds = np.std(data, axis=0)
                z_scores = np.abs((data[i] - means) / stds)
                feature_idx = np.argmax(z_scores)
                feature_name = numeric_cols[feature_idx]
                
                explanations.append({
                    "index": i,
                    "severity": severity,
                    "reason": f"Statistical outlier detected. Feature '{feature_name}' deviated by {z_scores[feature_idx]:.2f}σ from the expected multi-modal distribution."
                })
                
    return result_df, explanations
