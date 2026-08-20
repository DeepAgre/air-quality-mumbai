from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import onnxruntime as ort

app = FastAPI(title="AirForecast Mumbai API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "sparse_rnn_aqi.onnx"
try:
    session = ort.InferenceSession(MODEL_PATH)
except Exception as e:
    print(f"Error loading ONNX model: {e}")

class PredictionRequest(BaseModel):
    sequence: list[float]
    days: int = Field(default=1, ge=1, le=3)

@app.get("/")
def read_root():
    return {"status": "online", "message": "AirForecast Mumbai RNN Inference API is running."}

@app.post("/predict")
def predict_aqi(data: PredictionRequest):
    try:
        seq = np.array(data.sequence, dtype=np.float32)

        if len(seq) != 20:
            return {"error": "Sequence must contain exactly 20 days of data."}

        forecast_days = max(1, min(data.days, 3))
        predictions = []
        current_window = seq.copy()

        # Autoregressive multi-step rolling loop
        for _ in range(forecast_days):
            input_tensor = current_window.reshape(1, 20, 1)
            input_name = session.get_inputs()[0].name
            pred = session.run(None, {input_name: input_tensor})[0]
            pred_value = float(pred.item())

            predictions.append(pred_value)
            current_window = np.append(current_window[1:], pred_value)

        primary_pred = predictions[0]
        if primary_pred <= 50:
            category, color = "Good", "emerald"
        elif primary_pred <= 100:
            category, color = "Moderate", "yellow"
        elif primary_pred <= 200:
            category, color = "Poor", "orange"
        else:
            category, color = "Severe", "red"

        return {
            "forecast_pm25": round(primary_pred, 2),
            "multi_day_forecast": [round(p, 2) for p in predictions],
            "aqi_category": category,
            "color": color,
        }
    except Exception as e:
        return {"error": str(e)}