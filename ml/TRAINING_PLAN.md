# EcoView — YOLOv8 Training Plan
**Phase 4–6 | Last Updated: 2026-05-16**

---

## What you're training

A **YOLOv8m object detection model** fine-tuned to detect environmental pollution in field photographs.

**3 classes (Phase 4–5):**
| Class | Description | Example |
|-------|-------------|---------|
| `garbage_dump` | Unsanctioned waste piles | Roadside dumping, illegal landfills |
| `plastic_waste` | Visible plastic debris | Plastic bags, bottles scattered outdoors |
| `industrial_smoke` | Visible smoke from stacks / chimneys | Factory exhaust, burning waste |

You will add more classes (water contamination, deforestation) after Phase 5 baseline is stable.

---

## Why this architecture

| Choice | Why |
|--------|-----|
| YOLOv8m | Best accuracy/speed tradeoff. YOLOv8n underfits on subtle pollution. YOLOv8l needs more GPU than Kaggle T4 provides. |
| Fine-tune COCO weights | Domain shift is large but COCO has general object priors. Faster convergence than training from scratch. |
| 3 classes first | Forces data quality discipline. Each class needs ≥400 annotated images for reliable detection. |
| ONNX export | Model is deployed as ONNX in FastAPI — faster than PyTorch, no CUDA needed at inference. |

---

## Phase 4 — Dataset Setup (do this first)

### Step 1: Collect images

**Target per class: 500–800 images minimum. 400 is usable but fragile.**

| Source | Classes | How to get it |
|--------|---------|---------------|
| TACO Dataset | garbage_dump, plastic_waste | taco-dataset.github.io → download |
| OpenLitterMap | plastic_waste | Kaggle: `openlittermap` dataset |
| Roboflow Universe | all 3 | roboflow.com → search "industrial smoke detection", "trash detection" |
| Kaggle smoke datasets | industrial_smoke | kaggle.com → search "smoke detection yolov8" |

**Minimum viable dataset:** 400 images/class = 1200 images total.
**Good dataset:** 700 images/class = 2100 images total.

### Step 2: Annotate with Roboflow

1. Create free Roboflow account at roboflow.com
2. Create new project → Object Detection
3. Upload images
4. Use Roboflow's browser annotation tool (draw bounding boxes)
5. Label rules:
   - Draw tight boxes — exclude surrounding clean area
   - If multiple objects overlap ≥50%, annotate both separately
   - Minimum box size: 20×20px (smaller boxes cause false negatives)
   - Garbage piles: draw one box around the whole pile, not individual items
6. Export as **YOLOv8 format** (YAML + label .txt files)

**Roboflow auto-augmentation:** Turn ON — it generates 3× more training images via flips, brightness, blur, crop.

### Step 3: DVC versioning

```bash
# From project root
dvc init
dvc remote add -d r2 s3://ecoview-datasets
dvc remote modify r2 endpointurl https://<ACCOUNT_ID>.r2.cloudflarestorage.com
dvc remote modify r2 access_key_id <R2_ACCESS_KEY_ID>
dvc remote modify r2 secret_access_key <R2_SECRET_KEY>

# Add dataset
dvc add data/datasets/phase4/
git add data/datasets/phase4.dvc .gitignore
git commit -m "Phase 4: Add annotated dataset v1"
dvc push
```

Anyone can recreate the dataset with `dvc pull` after this.

---

## Phase 5 — Training on Kaggle

### Setup

1. Go to kaggle.com → New Notebook
2. Enable GPU: Settings → Accelerator → GPU T4 x2
3. Upload your dataset (or use Kaggle Datasets API to pull from your Roboflow export)

### Training notebook structure

```python
# 1. Install
!pip install ultralytics wandb -q

# 2. W&B init (create account at wandb.ai first)
import wandb
wandb.init(project="ecoview-yolov8", name="phase5-run1")

# 3. Load model
from ultralytics import YOLO
model = YOLO("yolov8m.pt")  # downloads pretrained COCO weights

# 4. Train
results = model.train(
    data="/path/to/dataset.yaml",
    epochs=100,
    imgsz=640,
    batch=16,           # T4 GPU fits batch=16 comfortably
    patience=20,        # stop if mAP doesn't improve for 20 epochs
    optimizer="AdamW",
    lr0=0.001,
    lrf=0.01,
    mosaic=1.0,         # YOLOv8 mosaic augmentation
    mixup=0.1,
    copy_paste=0.1,
    degrees=15.0,
    translate=0.1,
    scale=0.5,
    project="ecoview",
    name="yolov8m-v1",
    save_period=10,
    val=True,
)

# 5. Export to ONNX
model.export(format="onnx", imgsz=640, opset=12, dynamic=False)
```

### Minimum acceptable metrics before Phase 6

| Metric | Target | Abort if below |
|--------|--------|----------------|
| mAP50 | ≥ 0.65 | < 0.45 (retrain with more data) |
| Precision | ≥ 0.70 | < 0.55 |
| Recall | ≥ 0.60 | < 0.50 |
| Inference speed (ONNX CPU) | < 500ms | — |

If metrics are below abort threshold, the most likely cause is insufficient training data. Add 200 more images per failing class before retraining.

### W&B logging

W&B tracks loss curves, mAP, and sample predictions automatically when initialized. After training, check:
- `train/box_loss` should trend down
- `val/box_loss` should not diverge from train loss (divergence = overfitting)
- `metrics/mAP50` should plateau, not drop

---

## Phase 6 — Evaluation + Calibration

### After training is done:

**1. Confusion matrix analysis**

```python
from ultralytics import YOLO
model = YOLO("runs/detect/yolov8m-v1/weights/best.pt")
metrics = model.val(data="dataset.yaml", plots=True)
# Check confusion_matrix.png — look for class confusion
```

**2. Confidence calibration (critical for production)**

Raw YOLOv8 confidence scores are not probabilities — they're overconfident at high values. Use Temperature Scaling:

```python
# Install calibration library
!pip install netcal

from netcal.metrics import ECE
from netcal.scaling import TemperatureScaling

# Collect raw model confidences on validation set
# ... (gather predictions and ground truth) ...

calibrator = TemperatureScaling()
calibrator.fit(confidences, ground_truth)
calibrated_confidences = calibrator.transform(raw_confidences)

# Expected Calibration Error should drop below 0.05
ece = ECE(bins=10)
print("ECE after calibration:", ece.measure(calibrated_confidences, ground_truth))
```

Save the calibrator temperature parameter (a single float) — it's baked into the FastAPI inference call.

**3. Grad-CAM visualizations**

```python
!pip install grad-cam
from pytorch_grad_cam import GradCAM
# ... visualize which pixels drive detections
# Used in portfolio — paste sample images into reports/
```

**4. Deploy to FastAPI**

Once ONNX file and temperature scaler are ready:
1. Copy `best.onnx` → `ml/models/yolov8m-ecoview-v1.onnx`
2. Update `backend/inference/classifier.py` — replace stub with real ONNX inference
3. Bump `MODEL_VERSION` constant
4. Run `pytest backend/tests/test_inference.py`

---

## ONNX Inference Implementation (Phase 6 → replace stub)

```python
# backend/inference/classifier.py — REPLACE STUB WITH THIS

import time
import numpy as np
import onnxruntime as ort
from PIL import Image
import httpx

MODEL_PATH = "ml/models/yolov8m-ecoview-v1.onnx"
TEMPERATURE = 1.4  # from calibration step

LABELS = ["garbage_dump", "plastic_waste", "industrial_smoke"]
SEVERITY_MAP = {
    "garbage_dump": "medium",
    "plastic_waste": "medium",
    "industrial_smoke": "high",
}

_session = None

def get_session():
    global _session
    if _session is None:
        _session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
    return _session

def preprocess(image: Image.Image, size=640):
    image = image.resize((size, size))
    arr = np.array(image).astype(np.float32) / 255.0
    return np.transpose(arr, (2, 0, 1))[None]  # BCHW

def classify_image(image_url: str) -> dict:
    start = time.perf_counter()

    resp = httpx.get(image_url, timeout=10)
    image = Image.open(io.BytesIO(resp.content)).convert("RGB")
    input_tensor = preprocess(image)

    session = get_session()
    outputs = session.run(None, {session.get_inputs()[0].name: input_tensor})

    # Parse YOLOv8 output: [batch, 4+num_classes, num_anchors]
    predictions = outputs[0][0].T  # [anchors, 4+classes]
    class_scores = predictions[:, 4:]
    best_idx = np.argmax(class_scores.max(axis=1))
    raw_conf = float(class_scores[best_idx].max())
    class_id = int(np.argmax(class_scores[best_idx]))

    # Temperature scaling
    calibrated_conf = 1 / (1 + np.exp(-np.log(raw_conf / (1 - raw_conf)) / TEMPERATURE))

    label = LABELS[class_id] if class_id < len(LABELS) else "unknown"
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    return {
        "label": label,
        "confidence": round(float(calibrated_conf), 3),
        "severity": SEVERITY_MAP.get(label, "medium"),
        "processing_time_ms": elapsed_ms,
        "model_version": "yolov8m-ecoview-v1",
    }
```

Also add to requirements.txt: `onnxruntime>=1.18`, `httpx`, `pillow`

---

## Checklist

**Phase 4:**
- [ ] Create Roboflow account
- [ ] Collect ≥400 images/class (TACO + Kaggle + manual)
- [ ] Annotate in Roboflow browser tool
- [ ] Export as YOLOv8 format
- [ ] Run `dvc init` + push to R2
- [ ] Commit dataset .dvc file

**Phase 5:**
- [ ] Create W&B account, run `wandb login`
- [ ] Create Kaggle notebook, enable T4 GPU
- [ ] Train YOLOv8m for 100 epochs
- [ ] Verify mAP50 ≥ 0.65
- [ ] Export to ONNX
- [ ] Download `best.onnx` → `ml/models/`

**Phase 6:**
- [ ] Run calibration, save temperature value
- [ ] Generate confusion matrix + Grad-CAM samples → `reports/`
- [ ] Replace `backend/inference/classifier.py` stub with ONNX inference
- [ ] Test inference endpoint: `POST /inference/classify`
- [ ] Update MODEL_VERSION constant
