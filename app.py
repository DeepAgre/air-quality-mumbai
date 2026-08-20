from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import onnxruntime as ort

app = FastAPI(title="AirForecast Mumbai API", version="2.0")

# Enable CORS so your frontend hosted on Vercel can access this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (or you can restrict to your Vercel domain)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the ONNX model runtime session
MODEL_PATH = "sparse_rnn_aqi.onnx"
try:
    session = ort.InferenceSession(MODEL_PATH)
except Exception as e:
    print(f"Error loading ONNX model: {e}")

# Pydantic request model with validation
class PredictionRequest(BaseModel):
    sequence: list[float]
    days: int = Field(default=1, ge=1, le=3)

@app.get("/")
def read_root():
    return {"status": "online", "message": "AirForecast Mumbai RNN Inference API is running."}

@app.post("/predict")
def predict_aqi(data: PredictionRequest):
    try:
        # Convert input list to numpy array
        seq = np.array(data.sequence, dtype=np.float32)

        if len(seq) != 20:
            return {"error": "Sequence must contain exactly 20 days of data."}

        # Ensure forecast horizon is between 1 and 3 days
        forecast_days = max(1, min(data.days, 3))
        predictions = []
        current_window = seq.copy()

        # Autoregressive multi-step rolling loop
        for _ in range(forecast_days):
            # Reshape input tensor for ONNX runtime model: [batch_size=1, sequence_length=20, features=1]
            input_tensor = current_window.reshape(1, 20, 1)

            # Run ONNX inference
            input_name = session.get_inputs()[0].name
            pred = session.run(None, {input_name: input_tensor})[0]
            pred_value = float(pred.item())

            predictions.append(pred_value)

            # Slide the window forward: drop the oldest value, append the new prediction
            current_window = np.append(current_window[1:], pred_value)

        # Classify the primary (tomorrow's) prediction into an AQI category
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