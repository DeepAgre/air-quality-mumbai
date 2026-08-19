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
    raise FileNotFoundError(f"Could not find '{file_path}' in the current directory. Make sure it's in d/rnn_mini_project/")

print("Loading dataset...")
df = pd.read_csv(file_path)

# Print columns to verify structure
print("Columns found:", df.columns.tolist())

# Ensure columns match expected names (adjusting for common naming conventions)
# Typically: 'From Date', 'To Date', 'PM2.5', 'AQI', etc. Let's make it robust:
df.columns = [c.strip().lower() for c in df.columns]

# Find the date column and target pollutant column (e.g., 'pm2.5' or 'aqi')
date_col = next((c for c in df.columns if 'date' in c or 'time' in c), df.columns[0])
target_col = next((c for c in df.columns if 'pm2.5' in c or 'aqi' in c), df.columns[1])

print(f"Using Date Column: '{date_col}' | Using Target Column: '{target_col}'")

# Sort chronologically and handle dates
df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
df = df.sort_values(date_col).reset_index(drop=True)

# Select target and handle missing values via linear interpolation (preserves time-series continuity)
df[target_col] = pd.to_numeric(df[target_col], errors='coerce')
df[target_col] = df[target_col].interpolate(method='linear').fillna(method='bfill').fillna(method='ffill')

raw_values = df[target_col].values

# ==========================================
# STEP 2: NORMALIZATION & SLIDING WINDOWS
# ==========================================
# Min-Max Normalization (Scale between 0 and 1)
min_val = raw_values.min()
max_val = raw_values.max()
scaled_values = (raw_values - min_val) / (max_val - min_val)

def create_sliding_windows(data, window_size=20):
    X, y = [], []
    for i in range(len(data) - window_size):
        X.append(data[i : i + window_size])
        y.append(data[i + window_size])
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)

WINDOW_SIZE = 20
X, y = create_sliding_windows(scaled_values, window_size=WINDOW_SIZE)

print(f"Created sliding windows -> X shape: {X.shape}, y shape: {y.shape}")

# Reshape X for RNN input: [Batch Size, Sequence Length, Features]
X = np.expand_dims(X, axis=-1)

# PyTorch Dataset Definition
class AQIDataset(Dataset):
    def __init__(self, X_data, y_data):
        self.X = torch.tensor(X_data, dtype=torch.float32)
        self.y = torch.tensor(y_data, dtype=torch.float32).unsqueeze(-1)
        
    def __len__(self):
        return len(self.X)
        
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

dataset = AQIDataset(X, y)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)


# ==========================================
# STEP 3: SPARSE TEMPORAL ATTENTION GRU MODEL
# ==========================================
class SparseAttentionGRU(nn.Module):
    def __init__(self, input_dim=1, hidden_dim=64):
        super(SparseAttentionGRU, self).__init__()
        self.gru = nn.GRU(input_dim, hidden_dim, batch_first=True)
        
        # Attention projection layers
        self.attention_weights = nn.Linear(hidden_dim, 1)
        
        # Final regression layers to predict next day value
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )
        
    def forward(self, x):
        # x shape: [Batch, Seq_Len, Input_Dim]
        gru_out, _ = self.gru(x) # [Batch, Seq_Len, Hidden_Dim]
        
        # Compute raw attention scores
        scores = self.attention_weights(gru_out).squeeze(-1) # [Batch, Seq_Len]
        
        # RESEARCH GAP FIX: Sparse Thresholding (Top-K gating) instead of standard Softmax.
        # This zeroes out irrelevant noise (sudden weather blips) and retains core trends.
        k = max(1, scores.size(1) // 3) # Keep top 33% most critical historical days
        topk_vals, _ = torch.topk(scores, k=k, dim=-1)
        threshold = topk_vals[:, -1].unsqueeze(-1)
        
        # Hard masking: elements below threshold are set to negative infinity (effectively 0 after exp)
        sparse_scores = torch.where(scores >= threshold, scores, torch.tensor(-1e9, device=scores.device))
        
        # Apply softmax only on the filtered sparse set
        attn_weights = torch.softmax(sparse_scores, dim=-1).unsqueeze(-1) # [Batch, Seq_Len, 1]
        
        # Context vector via weighted sum
        context = torch.sum(gru_out * attn_weights, dim=1) # [Batch, Hidden_Dim]
        
        # Final prediction
        out = self.fc(context)
        return out, attn_weights

# Initialize model, loss, and optimizer
model = SparseAttentionGRU(input_dim=1, hidden_dim=64)
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

print("Model architecture compiled successfully!")
print(model)

# ==========================================
# STEP 4: QUICK TRAINING LOOP SANITY CHECK
# ==========================================
print("\nRunning a quick training test (2 epochs)...")
model.train()
for epoch in range(2):
    total_loss = 0
    for batch_x, batch_y in dataloader:
        optimizer.zero_grad()
        predictions, _ = model(batch_x)
        loss = criterion(predictions, batch_y)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    print(f"Epoch {epoch+1}/2 | Loss: {total_loss / len(dataloader):.4f}")

print("\nPipeline is fully functional and ready for training!")