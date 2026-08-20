from fastapi import FastAPI, HTTPException
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
            raise HTTPException(status_code=400, detail="Sequence must contain exactly 20 days of data.")

        # Scale inputs to match model's training range (0 to 1)
        SCALE_FACTOR = 150.0
        normalized_seq = (seq / SCALE_FACTOR).astype(np.float32)

        forecast_days = max(1, min(data.days, 3))
        predictions = []
        current_window = normalized_seq.copy()

        input_name = session.get_inputs()[0].name

        # Autoregressive multi-step rolling loop
        for _ in range(forecast_days):
            input_tensor = current_window.reshape(1, 20, 1).astype(np.float32)
            pred = session.run(None, {input_name: input_tensor})[0]
            pred_val_normalized = float(pred.item())

            predictions.append(pred_val_normalized)
            current_window = np.append(current_window[1:], pred_val_normalized).astype(np.float32)

        # Convert predictions back to original µg/m³ scale
        unscaled_predictions = [float(p * SCALE_FACTOR) for p in predictions]
        primary_pred = unscaled_predictions[0]

        # Rich category mapping with health advisories
        if primary_pred <= 50:
            category = "Good"
            description = "Air quality is satisfactory, and air pollution poses little or no risk. Enjoy your outdoor activities!"
            color = "emerald"
        elif primary_pred <= 100:
            category = "Moderate"
            description = "Air quality is acceptable. However, sensitive individuals may experience minor irritation."
            color = "yellow"
        elif primary_pred <= 200:
            category = "Poor"
            description = "Breathing discomfort may occur for people with lungs, asthma, or heart conditions. Limit prolonged outdoor exertion."
            color = "orange"
        else:
            category = "Severe"
            description = "Health alert: severe risk of respiratory effects. Avoid going outside and keep windows closed."
            color = "red"

        return {
            "forecast_pm25": round(primary_pred, 2),
            "multi_day_forecast": [round(p, 2) for p in unscaled_predictions],
            "aqi_category": category,
            "description": description,
            "color": color,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))