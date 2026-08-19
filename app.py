import os
import numpy as np
import pandas as pd
import onnxruntime as ort
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Mumbai AQI Sparse RNN Predictor", version="2.0")

# Enable CORS for local development and production flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. LOAD ONNX MODEL & SCALING BOUNDS
# ==========================================
MODEL_PATH = "sparse_rnn_aqi.onnx"
DATA_PATH = "city_averaged.csv"

if not os.path.exists(MODEL_PATH):
    raise RuntimeError(f"Could not find {MODEL_PATH}. Run train_and_evaluate.py first.")

ort_session = ort.InferenceSession(MODEL_PATH)

df = pd.read_csv(DATA_PATH)
df.columns = [c.strip().lower() for c in df.columns]
target_col = next((c for c in df.columns if 'pm25' in c or 'aqi' in c), df.columns[1])
raw_values = pd.to_numeric(df[target_col], errors='coerce').interpolate().bfill().ffill().values

train_split_idx = int(len(raw_values) * 0.8)
min_val = float(raw_values[:train_split_idx].min())
max_val = float(raw_values[:train_split_idx].max())

# ==========================================
# 2. API REQUEST SCHEMA
# ==========================================
class AQIRequest(BaseModel):
    history: list[float]  # Exactly 20 historical PM2.5 values

@app.post("/predict")
def predict_pm25(payload: AQIRequest):
    if len(payload.history) != 20:
        raise HTTPException(
            status_code=400, 
            detail=f"Expected exactly 20 historical values, got {len(payload.history)}."
        )
    
    try:
        input_array = np.array(payload.history, dtype=np.float32)
        scaled_input = (input_array - min_val) / (max_val - min_val)
        tensor_input = np.expand_dims(scaled_input, axis=(0, -1))
        
        ort_inputs = {ort_session.get_inputs()[0].name: tensor_input}
        ort_outs = ort_session.run(None, ort_inputs)
        
        scaled_prediction = ort_outs[0][0][0]
        final_prediction = float(scaled_prediction * (max_val - min_val) + min_val)
        
        # Determine air quality health category
        val = round(final_prediction, 2)
        if val <= 60:
            status = "Satisfactory / Moderate"
            color = "green"
        elif val <= 120:
            status = "Poor / Moderate Pollution Risk"
            color = "yellow"
        else:
            status = "Very Poor / High Pollution Alert"
            color = "red"
            
        return {
            "status": "success",
            "predicted_pm25_next_day": val,
            "air_quality_status": status,
            "risk_level": color
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))