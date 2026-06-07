# Session 02 — EDA, Validation & Preprocessing Pipeline

**Role:** Data Validation & EDA Analyst

**Deliverable:** `eda_validation.ipynb` — a Kaggle CPU notebook that validates the dataset, produces visual diagnostics, and finalizes the preprocessing pipeline config.

---

## Inputs Required

Attach these files to your context window before starting:
- `MASTER_PLAN.md`
- `outputs/s1_dataset_stats.txt` (from Session 01)

---

## What This Session Must Produce

1. `eda_validation.ipynb` with:
   - Image dimension distribution histogram
   - Multi-label co-occurrence heatmap
   - Sample grid (8 images per label category)
   - Class imbalance bar chart
   - Augmentation preview (before/after side by side)
2. `context/preprocessing_config.py` — finalized preprocessing constants (resolution, normalization stats)

---

## EDA Tasks

### 1. Dimension Profiling
```python
# For each image in train.csv:
# - Record (width, height, channels)
# - Plot distribution
# - Confirm: target resize = 224×224 is safe (no images smaller than 200×200)
# - If >10% of images are smaller → switch to 128×128 and flag in decisions.md
```

### 2. Corruption Re-check
```python
# Second pass with PIL.Image.verify() and attempting actual pixel access
# Log any images that opened in S1 but fail here
# Remove from train.csv/val.csv
```

### 3. Co-occurrence Matrix
```python
# Count how often each label pair co-occurs in the same image
# Plot as Seaborn heatmap
# Key insight: if Air+Land co-occurrence > 15%, multi-label is justified
```

### 4. Class Imbalance Check
```python
# Target: each label should appear in 20–50% of images
# If Clean < 20% → flag, may need to source more clean images
# If any pollution label > 60% → undersample or apply weighted loss
```

### 5. Augmentation Preview
```python
# Apply this transform to 5 sample images and display before/after:
import albumentations as A
train_transform = A.Compose([
    A.Resize(224, 224),
    A.HorizontalFlip(p=0.5),
    A.ShiftScaleRotate(shift_limit=0.05, scale_limit=0.1, rotate_limit=15, p=0.5),
    A.RandomCrop(height=200, width=200, p=0.3),
    A.Resize(224, 224),  # resize back after crop
    A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])
# VERIFY: smog brownness, water discoloration, garbage colors are NOT washed out
```

---

## Preprocessing Config to Lock

Create `context/preprocessing_config.py`:
```python
# Finalized after EDA — do not change after Session 03 starts

IMAGE_SIZE = 224          # confirm or update based on EDA
BATCH_SIZE = 32           # adjust down to 16 if GPU OOM in S4
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

NUM_LABELS = 4
LABEL_COLUMNS = ["Air_Pollution", "Land_Pollution", "Water_Pollution", "Clean"]
TABULAR_DIM = 9           # 4 season + 5 aqi bins
```

---

## Decision Gate

Before moving to Session 03, confirm in `context/decisions.md`:
- [ ] Confirmed image resolution (224×224 or adjusted)
- [ ] No critical corruption issues remain
- [ ] Co-occurrence matrix shows meaningful multi-label overlap (>5%)
- [ ] Color-sensitive augmentations are NOT applied (no HueSaturation, Grayscale, ColorJitter)
- [ ] Augmentation preview looks correct visually

---

## Handoff

Save the notebook to the Kaggle output. Paste key findings into `outputs/s2_eda_report.txt`:
```
Confirmed resolution: ___×___
Images removed in re-check: ___
Air+Land co-occurrence %: ___
Air+Water co-occurrence %: ___
Class with highest imbalance: ___ (___%)
Augmentation: APPROVED / NEEDS ADJUSTMENT
```

Then start Session 03 with: `MASTER_PLAN.md` + `sessions/session_03_model.md` + `context/preprocessing_config.py`
