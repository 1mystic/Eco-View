# Session 05 — Grad-CAM, Diagnostics & Optimization

**Role:** ML Diagnostics Expert (Agent 4)

**Deliverable:** `gradcam.py` + optional targeted fixes to `train.py` if metrics indicate overfitting or convergence issues.

**Note:** Only generate code fixes if the metrics in S4 logs warrant it. Do not rewrite the whole notebook — output only the specific adjustments needed.

---

## Inputs Required

Attach these files before starting:
- `MASTER_PLAN.md`
- `outputs/s4_training_logs.txt` (training metrics from S4)
- `model.py` (to know the architecture for Grad-CAM layer targeting)

---

## What This Session Must Produce

1. `gradcam.py` — Grad-CAM heatmap generator targeting EfficientNet-B0's last conv layer
2. 8 sample heatmap images saved to `outputs/gradcam_samples/`
3. (Conditional) Targeted fixes to `train.py` if diagnostics reveal issues

---

## Grad-CAM Implementation

EfficientNet-B0's target layer for Grad-CAM:
```python
# The last convolutional block before global average pooling
target_layer = model.backbone.conv_head  # or model.backbone.blocks[-1]
```

```python
import torch
import torch.nn.functional as F
import numpy as np
import cv2
from PIL import Image

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.gradients = None
        self.activations = None
        
        target_layer.register_forward_hook(self._save_activation)
        target_layer.register_full_backward_hook(self._save_gradient)
    
    def _save_activation(self, module, input, output):
        self.activations = output.detach()
    
    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()
    
    def generate(self, image, tabular, label_idx):
        """
        label_idx: 0=Air, 1=Land, 2=Water, 3=Clean
        Returns: heatmap overlay as numpy (H,W,3) uint8
        """
        self.model.eval()
        logits = self.model(image.unsqueeze(0), tabular.unsqueeze(0))
        
        self.model.zero_grad()
        logits[0, label_idx].backward()
        
        weights = self.gradients.mean(dim=[2, 3], keepdim=True)  # (1, C, 1, 1)
        cam = (weights * self.activations).sum(dim=1).squeeze()  # (H, W)
        cam = F.relu(cam)
        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-8)
        cam = cam.cpu().numpy()
        
        # Resize to 224×224 and overlay on original image
        cam = cv2.resize(cam, (224, 224))
        heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        # Blend with original
        orig = np.array(image.permute(1,2,0).cpu() * 255, dtype=np.uint8)
        overlay = (0.5 * orig + 0.5 * heatmap).astype(np.uint8)
        return overlay
```

**Verification check:** Run on 2 Air_Pollution images. The heatmap should highlight sky/horizon areas (smoke, haze), NOT random corners. If it highlights random areas → the model has not learned correctly → flag in `context/decisions.md`.

---

## Diagnostic Decision Tree

Read `outputs/s4_training_logs.txt` and apply the appropriate fix:

### Case A: Macro F1 > 0.75 — No action needed
Proceed directly to Session 06.

### Case B: Train F1 >> Val F1 (gap > 0.15) — Overfitting
Apply these targeted changes to `train.py`:
```python
# 1. Increase dropout in classifier head
self.classifier = nn.Sequential(
    nn.Dropout(0.5),    # was 0.4
    nn.Linear(fused_dim, 256),
    nn.ReLU(),
    nn.Dropout(0.4),    # was 0.3
    nn.Linear(256, num_labels),
)

# 2. Increase weight decay in Phase 2 optimizer
optimizer_phase2 = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=5e-2)  # was 1e-2

# 3. Add stronger augmentation in train_transform
A.ShiftScaleRotate(shift_limit=0.1, scale_limit=0.15, rotate_limit=20, p=0.6),  # was p=0.5
```

### Case C: Both Train F1 and Val F1 low (<0.5) — Underfitting or label bugs
```python
# Check 1: Are labels actually correct? Print 5 samples from val.csv with image preview
# Check 2: Lower threshold for prediction
preds = (torch.sigmoid(logits) > 0.3).cpu().numpy()  # try 0.3 instead of 0.5

# Check 3: Increase Phase 2 epochs to 12 and add more warmup
# Check 4: Add label smoothing
criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([1.5, 1.5, 2.0, 1.0]))  # upweight minority
```

### Case D: Loss is NaN or exploding — Gradient issue
```python
# Add gradient clipping to both phase optimizers
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
```

---

## Output

Save 8 heatmap images to `outputs/gradcam_samples/` with naming:
`{label}_{correct|wrong}_{idx}.png`

e.g., `Air_correct_001.png`, `Land_wrong_003.png`

---

## Handoff

Record in `outputs/s5_metrics.txt`:
```
Final Macro F1 (after any fixes): ___
Final Hamming Loss:                ___
Grad-CAM visually sensible?        Yes / No
Diagnostic case applied:           A / B / C / D / None
Fixes applied:                     (list or "none")
Ready for deployment:              Yes / Needs another training run
```

Then start Session 06 with: `MASTER_PLAN.md` + `sessions/session_06_deploy.md` + `outputs/s5_metrics.txt`
