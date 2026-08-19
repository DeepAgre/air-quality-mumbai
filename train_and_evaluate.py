import os
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

# ==========================================
# STEP 1: LOAD AND CLEAN THE DATASET
# ==========================================
file_path = "city_averaged.csv"

if not os.path.exists(file_path):
    raise FileNotFoundError(f"Could not find '{file_path}'. Make sure it's in d/rnn_mini_project/")

print("Loading dataset...")
df = pd.read_csv(file_path)
df.columns = [c.strip().lower() for c in df.columns]

date_col = next((c for c in df.columns if 'date' in c or 'time' in c), df.columns[0])
target_col = next((c for c in df.columns if 'pm25' in c or 'aqi' in c), df.columns[1])

print(f"Using Date Column: '{date_col}' | Target Column: '{target_col}'")

df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
df = df.sort_values(date_col).reset_index(drop=True)

df[target_col] = pd.to_numeric(df[target_col], errors='coerce')
df[target_col] = df[target_col].interpolate(method='linear').bfill().ffill()

raw_values = df[target_col].values

# ==========================================
# STEP 2: CHRONOLOGICAL SPLIT & TRAIN-ONLY SCALING
# ==========================================
# Prevent data leakage by computing min/max strictly on the training portion (first 80%)
train_split_idx = int(len(raw_values) * 0.8)
train_raw = raw_values[:train_split_idx]

min_val = float(train_raw.min())
max_val = float(train_raw.max())

# Scale all values using training parameters
scaled_values = (raw_values - min_val) / (max_val - min_val)

def create_sliding_windows(data, window_size=20):
    X, y = [], []
    for i in range(len(data) - window_size):
        X.append(data[i : i + window_size])
        y.append(data[i + window_size])
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)

WINDOW_SIZE = 20
X, y = create_sliding_windows(scaled_values, window_size=WINDOW_SIZE)
X = np.expand_dims(X, axis=-1)

# Split sliding windows chronologically
X_train, X_test = X[:train_split_idx - WINDOW_SIZE], X[train_split_idx - WINDOW_SIZE:]
y_train, y_test = y[:train_split_idx - WINDOW_SIZE], y[train_split_idx - WINDOW_SIZE:]

print(f"Train samples: {len(X_train)} | Test samples: {len(X_test)}")

class AQIDataset(Dataset):
    def __init__(self, X_data, y_data):
        self.X = torch.tensor(X_data, dtype=torch.float32)
        self.y = torch.tensor(y_data, dtype=torch.float32).unsqueeze(-1)
    def __len__(self):
        return len(self.X)
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

train_loader = DataLoader(AQIDataset(X_train, y_train), batch_size=32, shuffle=True)
test_loader = DataLoader(AQIDataset(X_test, y_test), batch_size=32, shuffle=False)


# ==========================================
# STEP 3: SPARSE TEMPORAL ATTENTION GRU MODEL
# ==========================================
class SparseAttentionGRU(nn.Module):
    def __init__(self, input_dim=1, hidden_dim=64):
        super(SparseAttentionGRU, self).__init__()
        self.gru = nn.GRU(input_dim, hidden_dim, batch_first=True)
        self.attention_weights = nn.Linear(hidden_dim, 1)
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )
        
    def forward(self, x):
        gru_out, _ = self.gru(x) 
        scores = self.attention_weights(gru_out).squeeze(-1) 
        
        # Sparse Attention Mechanism
        k = max(1, scores.size(1) // 3) 
        topk_vals, _ = torch.topk(scores, k=k, dim=-1)
        threshold = topk_vals[:, -1].unsqueeze(-1)
        
        sparse_scores = torch.where(scores >= threshold, scores, torch.tensor(-1e9, device=scores.device))
        attn_weights = torch.softmax(sparse_scores, dim=-1).unsqueeze(-1) 
        
        context = torch.sum(gru_out * attn_weights, dim=1) 
        out = self.fc(context)
        return out, attn_weights

model = SparseAttentionGRU(input_dim=1, hidden_dim=64)
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)


# ==========================================
# STEP 4: TRAINING LOOP
# ==========================================
EPOCHS = 20
print(f"\nStarting training for {EPOCHS} epochs...")

for epoch in range(EPOCHS):
    model.train()
    total_loss = 0
    for batch_x, batch_y in train_loader:
        optimizer.zero_grad()
        preds, _ = model(batch_x)
        loss = criterion(preds, batch_y)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    
    if (epoch + 1) % 5 == 0 or epoch == 0:
        print(f"Epoch {epoch+1}/{EPOCHS} | Train MSE Loss: {total_loss / len(train_loader):.5f}")


# ==========================================
# STEP 5: EVALUATION & METRICS
# ==========================================
model.eval()
preds_list, actuals_list = [], []

with torch.no_grad():
    for batch_x, batch_y in test_loader:
        preds, _ = model(batch_x)
        preds_list.extend(preds.numpy().flatten())
        actuals_list.extend(batch_y.numpy().flatten())

preds_arr = np.array(preds_list) * (max_val - min_val) + min_val
actuals_arr = np.array(actuals_list) * (max_val - min_val) + min_val

mae = np.mean(np.abs(preds_arr - actuals_arr))
rmse = np.sqrt(np.mean((preds_arr - actuals_arr) ** 2))

print("\n--- Model Evaluation Results ---")
print(f"Mean Absolute Error (MAE): {mae:.2f}")
print(f"Root Mean Squared Error (RMSE): {rmse:.2f}")


# ==========================================
# STEP 6: EXPORT TO ONNX
# ==========================================
onnx_filename = "sparse_rnn_aqi.onnx"
dummy_input = torch.randn(1, WINDOW_SIZE, 1, dtype=torch.float32)

torch.onnx.export(
    model,
    dummy_input,
    onnx_filename,
    export_params=True,
    opset_version=11,
    input_names=['input_sequence'],
    output_names=['prediction'],
    dynamic_axes={
        'input_sequence': {0: 'batch_size'},
        'prediction': {0: 'batch_size'}
    }
)

print(f"\nSuccess! Model exported to '{onnx_filename}' successfully.")