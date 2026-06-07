# Ecoview — Indian Context Pollution Classifier: Master Plan

## Project Summary

Multi-label image classifier detecting concurrent pollution types in Indian environmental images.

**Labels:** `[Air_Pollution, Land_Pollution, Water_Pollution, Clean]`

**Architecture:** EfficientNet-B0 (vision backbone) + 2-layer MLP (tabular metadata) fused via concatenation → 4-node Sigmoid head

**Infrastructure:** Kaggle CPU (data prep) + Kaggle T4 GPU (training) + W&B (experiment tracking) → Hugging Face Spaces (deployment)

---

## Key Decisions (Locked)

| Decision | Choice | Reason |
|---|---|---|
| Problem type | Multi-label (not multi-class) | Real scenes combine pollution types |
| Vision backbone | EfficientNet-B0 via `timm` | Best accuracy/speed tradeoff at 224×224 |
| Metadata vector | Seasonal (4 categories) + AQI bin (5 ranges) | Synthetic-friendly, no external API needed |
| Loss function | `BCEWithLogitsLoss` | Standard for multi-label |
| Eval metrics | Macro F1-Score + Hamming Loss | Accuracy misleading for multi-label |
| Augmentations | Geometric only (flip, rotate, crop) | Color changes destroy pollution indicators |
| Explainability | Grad-CAM on last conv layer | Visual debugging + resume value |
| Quantization | PyTorch Dynamic int8 | ~4× size reduction for CPU inference |
| Deployment | Gradio on Hugging Face Spaces | Free, interactive, shareable |

### Tabular Metadata Vector (9 features)
```
[season_monsoon, season_summer, season_winter, season_post_monsoon,  # one-hot (4)
 aqi_bin_good, aqi_bin_moderate, aqi_bin_unhealthy, aqi_bin_very_unhealthy, aqi_bin_hazardous]  # one-hot (5)
```
Generated synthetically based on image label context (e.g., Air_Pollution images → higher AQI bins).

---

## Session Map — Execute in Order

Each session is self-contained. Open a fresh Claude Code window and load ONLY the relevant session file as context.

| Session | File | Deliverable | Kaggle Resource |
|---|---|---|---|
| **S1** | [sessions/session_01_data.md](sessions/session_01_data.md) | `build_dataset.py` | CPU |
| **S2** | [sessions/session_02_eda.md](sessions/session_02_eda.md) | `eda_validation.ipynb` | CPU |
| **S3** | [sessions/session_03_model.md](sessions/session_03_model.md) | `model.py` + `train.py` | CPU (debug) |
| **S4** | [sessions/session_04_training.md](sessions/session_04_training.md) | Trained `.pth` checkpoint | **GPU (T4)** |
| **S5** | [sessions/session_05_diagnostics.md](sessions/session_05_diagnostics.md) | `gradcam.py` + metric report | CPU/GPU |
| **S6** | [sessions/session_06_deploy.md](sessions/session_06_deploy.md) | Live HF Space URL | CPU |

---

## Folder Structure (Final)

```
ML-model/
├── MASTER_PLAN.md              ← this file
├── project.md                  ← original spec
├── context/
│   └── decisions.md            ← running log of choices made
├── sessions/
│   ├── session_01_data.md
│   ├── session_02_eda.md
│   ├── session_03_model.md
│   ├── session_04_training.md
│   ├── session_05_diagnostics.md
│   └── session_06_deploy.md
└── outputs/
    ├── s1_dataset_stats.txt     ← filled after S1
    ├── s2_eda_report.txt        ← filled after S2
    ├── s4_training_logs.txt     ← filled after S4 (paste from W&B)
    └── s5_metrics.txt           ← filled after S5
```

---

## Hand-off Protocol Between Sessions

After each session completes:
1. Paste any relevant output (dataset stats, training logs, F1 scores) into `outputs/sN_*.txt`
2. Update `context/decisions.md` with any choices made during that session
3. Start the next session window and attach only `MASTER_PLAN.md` + the next `sessions/sessionN.md` as context

---

## Kaggle GPU Budget Tracking

Total free GPU quota: ~30 hrs/week (T4), use strategically.

| Run | Expected Duration | Notes |
|---|---|---|
| S3 dry-run (CPU) | ~5 min | 1 batch sanity check |
| S4 full training | ~90 min | 10 epochs, EfficientNet-B0, 224×224 |
| S5 Grad-CAM | ~10 min | CPU is fine |
| Total | ~2 hrs | Well within budget |
