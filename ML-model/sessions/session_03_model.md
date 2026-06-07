# Session 03 — Model Architecture & Training Code

**Role:** PyTorch & Pipeline Architect (Agent 2)

**Deliverable:** `model.py` + `train.py` — complete, bug-free PyTorch code ready to drop into a Kaggle GPU notebook. Includes a 1-batch CPU dry-run test before the real GPU run.

---

## Inputs Required

Attach these files before starting:
- `MASTER_PLAN.md`
- `context/preprocessing_config.py` (from Session 02)
- `outputs/s2_eda_report.txt` (for batch size / resolution confirmation)

---

## What This Session Must Produce

1. `model.py` — `PollutionClassifier` class
2. `dataset.py` — `PollutionDataset` PyTorch Dataset class
3. `train.py` — full training loop with W&B logging
4. Proof of 1-batch CPU dry-run passing without errors

---

## model.py — Architecture Spec

```python
import torch
import torch.nn as nn
import timm

class TabularMLP(nn.Module):
    """Processes 9-feature metadata vector → 64-dim embedding."""
    def __init__(self, input_dim=9, hidden_dim=64, output_dim=64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, output_dim),
            nn.ReLU(),
        )
    def forward(self, x):
        return self.net(x)  # (B, 64)


class PollutionClassifier(nn.Module):
    """
    Dual-head vision-tabular fusion model.
    
    Image path:    (B,3,224,224) → EfficientNet-B0 → (B, 1280)
    Tabular path:  (B, 9)        → TabularMLP       → (B, 64)
    Fusion:        concat → (B, 1344) → Linear → (B, 4)
    """
    def __init__(self, num_labels=4, tabular_dim=9, freeze_backbone=True):
        super().__init__()
        self.backbone = timm.create_model(
            'efficientnet_b0', pretrained=True, num_classes=0  # remove classifier head
        )
        backbone_out = self.backbone.num_features  # 1280 for EfficientNet-B0
        
        self.tabular_mlp = TabularMLP(input_dim=tabular_dim)
        
        fused_dim = backbone_out + 64  # 1280 + 64 = 1344
        self.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(fused_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_labels),
            # NO Sigmoid here — BCEWithLogitsLoss handles it
        )
        
        if freeze_backbone:
            for param in self.backbone.parameters():
                param.requires_grad = False
    
    def unfreeze_backbone(self):
        for param in self.backbone.parameters():
            param.requires_grad = True
    
    def forward(self, image, tabular):
        fv = self.backbone(image)          # (B, 1280)
        ft = self.tabular_mlp(tabular)     # (B, 64)
        fused = torch.cat([fv, ft], dim=1) # (B, 1344)
        return self.classifier(fused)      # (B, 4) — raw logits
```

---

## dataset.py — Dataset Spec

```python
class PollutionDataset(torch.utils.data.Dataset):
    """
    Reads image_path, label columns, and tabular columns from a CSV.
    Applies Albumentations transforms.
    Returns: (image_tensor, tabular_tensor, label_tensor)
    """
    LABEL_COLS   = ["Air_Pollution", "Land_Pollution", "Water_Pollution", "Clean"]
    TABULAR_COLS = ["season_monsoon","season_summer","season_winter","season_post_monsoon",
                    "aqi_good","aqi_moderate","aqi_unhealthy","aqi_very_unhealthy","aqi_hazardous"]
    
    def __init__(self, csv_path, transform=None):
        ...
    
    def __getitem__(self, idx):
        # Returns: image (C,H,W), tabular (9,), labels (4,) — all torch.float32
        ...
```

---

## train.py — Training Loop Spec

### Phase 1 (Epochs 1–2): Backbone frozen, train fusion head only
```python
optimizer_phase1 = torch.optim.Adam(
    filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3
)
```

### Phase 2 (Epochs 3–10): Unfreeze backbone, lower LR
```python
model.unfreeze_backbone()
optimizer_phase2 = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-2)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer_phase2, T_max=8)
```

### Loss
```python
criterion = nn.BCEWithLogitsLoss()
```

### W&B Logging (log every batch)
```python
import wandb
wandb.init(project="ecoview-pollution-classifier", config={...})
wandb.log({
    "train/loss": loss.item(),
    "train/macro_f1": ...,
    "val/loss": ...,
    "val/macro_f1": ...,
    "val/hamming_loss": ...,
    "lr": optimizer.param_groups[0]['lr'],
})
```

### Metrics
```python
from sklearn.metrics import f1_score, hamming_loss
# Apply threshold=0.5 to sigmoid(logits) for binary predictions
preds = (torch.sigmoid(logits) > 0.5).cpu().numpy()
macro_f1 = f1_score(labels, preds, average='macro', zero_division=0)
h_loss    = hamming_loss(labels, preds)
```

### Checkpoint Saving
```python
# Save best model based on val macro F1
torch.save(model.state_dict(), "best_model.pth")
```

---

## CPU Dry-Run Test (Required Before S4)

Add this at the bottom of `train.py`:
```python
if __name__ == "__main__" and "--dry-run" in sys.argv:
    model = PollutionClassifier(freeze_backbone=True)
    dummy_img = torch.randn(2, 3, 224, 224)
    dummy_tab = torch.randn(2, 9)
    dummy_lbl = torch.randint(0, 2, (2, 4)).float()
    logits = model(dummy_img, dummy_tab)
    loss = nn.BCEWithLogitsLoss()(logits, dummy_lbl)
    loss.backward()
    print(f"Dry-run PASSED. Logits shape: {logits.shape}, Loss: {loss.item():.4f}")
```

**Run this locally or on Kaggle CPU. Only proceed to S4 if it prints "Dry-run PASSED".**

---

## Handoff

Record in `context/decisions.md`:
- Backbone output dim confirmed: `___` (should be 1280)
- Dry-run: PASSED / FAILED (if failed, document fix)

Then start Session 04 with: `MASTER_PLAN.md` + `sessions/session_04_training.md` + all three `.py` files
