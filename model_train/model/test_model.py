import joblib
import pandas as pd

# Load model and encoders
model = joblib.load("model/claim_priority_model.pkl")
encoders = joblib.load("model/encoders.pkl")

# Example input (strings allowed here)
data = {
    "claim_amount": 75000,
    "days_pending": 1,
    "followups_done": 2,
    "insurance_company": "BlueCross",
    "claim_status": "Under Review"
}

df = pd.DataFrame([data])

# Encode categorical columns
df["insurance_company"] = encoders["insurance_company"].transform(df["insurance_company"])
df["claim_status"] = encoders["claim_status"].transform(df["claim_status"])

# Predict
prediction = model.predict(df)

# Decode priority
priority = encoders["priority"].inverse_transform(prediction)

print("Predicted Priority:", priority[0])