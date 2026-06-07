# Session 06 — Quantization, Gradio App & Hugging Face Deployment

**Role:** Deployment & Optimization Engineer

**Deliverable:** Live Hugging Face Space URL with Gradio interface.

---

## Inputs Required

Attach these files before starting:
- `MASTER_PLAN.md`
- `model.py`
- `outputs/s5_metrics.txt` (final metrics, confirms model is ready)
- `best_model.pth` (downloaded from Kaggle)

---

## What This Session Must Produce

1. `quantize.py` — applies int8 dynamic quantization, saves `best_model_quantized.pth`
2. `app.py` — Gradio interface with image upload + metadata sliders + Grad-CAM output
3. `requirements.txt` — for Hugging Face Space
4. Uploaded and live Hugging Face Space

---

## Step 1: Dynamic Quantization

```python
# quantize.py
import torch
from model import PollutionClassifier

model = PollutionClassifier(freeze_backbone=False)
model.load_state_dict(torch.load("best_model.pth", map_location="cpu"))
model.eval()

# Dynamic quantization — converts Linear layers to int8
quantized = torch.quantization.quantize_dynamic(
    model,
    {torch.nn.Linear},   # target only Linear layers
    dtype=torch.qint8
)

torch.save(quantized.state_dict(), "best_model_quantized.pth")

# Verify size reduction
import os
orig_mb = os.path.getsize("best_model.pth") / 1e6
quant_mb = os.path.getsize("best_model_quantized.pth") / 1e6
print(f"Original: {orig_mb:.1f} MB  →  Quantized: {quant_mb:.1f} MB  ({orig_mb/quant_mb:.1f}x reduction)")
```

Expected output: `Original: ~17 MB → Quantized: ~4–5 MB (3.5–4x reduction)`

---

## Step 2: Gradio App

```python
# app.py
import gradio as gr
import torch
import numpy as np
from PIL import Image
import albumentations as A
from model import PollutionClassifier
from gradcam import GradCAM

LABEL_NAMES = ["Air Pollution", "Land Pollution", "Water Pollution", "Clean"]
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

model = PollutionClassifier(freeze_backbone=False)
model.load_state_dict(torch.load("best_model_quantized.pth", map_location="cpu"))
model.eval()

transform = A.Compose([
    A.Resize(224, 224),
    A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

def build_tabular(season: str, aqi: str) -> torch.Tensor:
    """Convert dropdown selections to 9-dim one-hot tensor."""
    seasons = ["Monsoon", "Summer", "Winter", "Post-Monsoon"]
    aqis = ["Good", "Moderate", "Unhealthy", "Very Unhealthy", "Hazardous"]
    s_vec = [1.0 if s == season else 0.0 for s in seasons]
    a_vec = [1.0 if a == aqi else 0.0 for a in aqis]
    return torch.tensor(s_vec + a_vec, dtype=torch.float32)

def predict(image, season, aqi_level):
    img_array = np.array(image.convert("RGB"))
    transformed = transform(image=img_array)["image"]
    img_tensor = torch.from_numpy(transformed).permute(2, 0, 1).float()
    
    tab_tensor = build_tabular(season, aqi_level)
    
    with torch.no_grad():
        logits = model(img_tensor.unsqueeze(0), tab_tensor.unsqueeze(0))
        probs = torch.sigmoid(logits).squeeze().numpy()
    
    # Grad-CAM — find highest predicted label
    dominant_label = int(probs.argmax())
    gradcam = GradCAM(model, model.backbone.conv_head)
    heatmap = gradcam.generate(img_tensor, tab_tensor, dominant_label)
    
    label_probs = {LABEL_NAMES[i]: float(probs[i]) for i in range(4)}
    return label_probs, Image.fromarray(heatmap)

demo = gr.Interface(
    fn=predict,
    inputs=[
        gr.Image(type="pil", label="Upload Environmental Image"),
        gr.Dropdown(["Monsoon", "Summer", "Winter", "Post-Monsoon"], 
                    label="Season", value="Summer"),
        gr.Dropdown(["Good", "Moderate", "Unhealthy", "Very Unhealthy", "Hazardous"],
                    label="Estimated Air Quality", value="Moderate"),
    ],
    outputs=[
        gr.Label(label="Pollution Probabilities"),
        gr.Image(type="pil", label="Grad-CAM Heatmap"),
    ],
    title="Ecoview — Indian Pollution Classifier",
    description="Upload an environmental image. The model detects Air, Land, and Water pollution simultaneously.",
    examples=[],   # add sample images here
)

if __name__ == "__main__":
    demo.launch()
```

---

## Step 3: requirements.txt

```
torch==2.1.0
torchvision==0.16.0
timm==0.9.12
albumentations==1.3.1
gradio==4.19.2
opencv-python-headless==4.9.0.80
numpy==1.26.4
Pillow==10.2.0
```

---

## Step 4: Hugging Face Space Setup

1. Create account at huggingface.co (free)
2. Create new Space: `New Space → Gradio → CPU Basic (free)`
3. Name: `ecoview-pollution-classifier`
4. Upload these files:
   - `app.py`
   - `model.py`
   - `gradcam.py`
   - `best_model_quantized.pth`
   - `requirements.txt`
5. Space builds automatically. Live URL: `https://huggingface.co/spaces/YOUR_USERNAME/ecoview-pollution-classifier`

---

## Handoff (Project Complete)

Record final output:
```
Quantized model size: ___ MB
HF Space URL:         https://huggingface.co/spaces/___/ecoview-pollution-classifier
Final Macro F1:       ___
Final Hamming Loss:   ___
W&B project URL:      https://wandb.ai/...
```

Update `context/decisions.md` with final deployment notes.

**Project complete. This URL is your resume link.**
