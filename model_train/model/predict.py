"""
predict.py — Claim Priority Prediction Module

Usage as a module:
    from model.predict import predict_priority
    result = predict_priority({
        "claim_amount": 80000,
        "days_pending": 45,
        "followups_done": 2,
        "insurance_company": "Cigna",
        "claim_status": "Denied",
    })
    # result → {"priority": "High"}

Usage from CLI (used by the Node.js backend):
    python model/predict.py '{"claim_amount":80000,...}'
"""

import os
import sys
import json
import joblib
import pandas as pd

# ── Resolve paths relative to this file's directory ───────────────────
_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(_DIR, "claim_priority_model.pkl")
METADATA_PATH = os.path.join(_DIR, "model_metadata.pkl")

# ── Lazy-loaded globals (cached after first call) ─────────────────────
_model = None
_metadata = None


def _load_artifacts():
    """Load model and metadata once, cache for subsequent calls."""
    global _model, _metadata
    if _model is None:
        _model = joblib.load(MODEL_PATH)
        _metadata = joblib.load(METADATA_PATH)
    return _model, _metadata


def predict_priority(data: dict) -> dict:
    """
    Predict claim priority from a dictionary of claim features.

    Parameters
    ----------
    data : dict
        Must contain: claim_amount, days_pending, followups_done,
                      insurance_company, claim_status

    Returns
    -------
    dict   e.g. {"priority": "High"}
    """
    model, metadata = _load_artifacts()
    encoders = metadata["encoders"]
    feature_columns = metadata["feature_columns"]

    # Build a single-row DataFrame
    df = pd.DataFrame([data])

    # Encode categorical features using the saved encoders
    for col in ["insurance_company", "claim_status"]:
        if col in df.columns:
            df[col] = encoders[col].transform(df[col])

    # Ensure correct column order
    df = df[feature_columns]

    # Predict and decode back to label
    prediction = model.predict(df)
    priority_label = encoders["priority"].inverse_transform(prediction)[0]

    return {"priority": priority_label}


# ── CLI entry-point (called by Node.js backend) ──────────────────────
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)

    try:
        input_data = json.loads(sys.argv[1])
        result = predict_priority(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
