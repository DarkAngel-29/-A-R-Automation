import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# ── Paths (relative to model_train/ working directory) ────────────────
DATA_PATH = os.path.join("data", "claims_dataset.csv")
MODEL_PATH = os.path.join("model", "claim_priority_model.pkl")
METADATA_PATH = os.path.join("model", "model_metadata.pkl")

# ── 1. Load dataset ──────────────────────────────────────────────────
print("Loading dataset …")
df = pd.read_csv(DATA_PATH)
print(f"Dataset shape: {df.shape}")
print(df.head())

# ── 2. Drop identifier columns safely ────────────────────────────────
df = df.drop(columns=["claim_id", "patient_id"], errors="ignore")

# ── 3. Encode categorical columns ────────────────────────────────────
encoders = {}

for col in ["insurance_company", "claim_status", "priority"]:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    encoders[col] = le
    print(f"  Encoded '{col}' — classes: {list(le.classes_)}")

# ── 4. Define features and target ────────────────────────────────────
FEATURE_COLUMNS = [
    "claim_amount",
    "days_pending",
    "followups_done",
    "insurance_company",
    "claim_status",
]

X = df[FEATURE_COLUMNS]
y = df["priority"]

# ── 5. Train / test split ────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"\nTrain size: {X_train.shape[0]}  |  Test size: {X_test.shape[0]}")

# ── 6. Train RandomForestClassifier ──────────────────────────────────
print("\nTraining model …")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# ── 7. Evaluate ──────────────────────────────────────────────────────
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\n✅ Model accuracy: {accuracy:.4f}")

target_names = list(encoders["priority"].classes_)
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=target_names))

# ── 8. Save model artifacts ──────────────────────────────────────────
joblib.dump(model, MODEL_PATH)
print(f"Model saved  → {MODEL_PATH}")

metadata = {
    "encoders": encoders,
    "feature_columns": FEATURE_COLUMNS,
}
joblib.dump(metadata, METADATA_PATH)
print(f"Metadata saved → {METADATA_PATH}")

print("\n🎉 Training complete.")