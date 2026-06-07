# Session 04 — GPU Training Run & W&B Monitoring

**Role:** Human-in-the-Loop Execution Coordinator (Agent 3)

**Deliverable:** Assembled `train_notebook.ipynb` ready for Kaggle T4 GPU, + `best_model.pth` checkpoint saved as Kaggle output artifact.

**IMPORTANT: This session uses the Kaggle T4 GPU. Every GPU minute is precious. Do not run on GPU until all code is verified to be bug-free.**

---

## Inputs Required

Attach these files before starting:
- `MASTER_PLAN.md`
- `model.py`, `dataset.py`, `train.py` (from Session 03)
- `context/preprocessing_config.py`
- Confirmation that CPU dry-run passed

---

## What This Session Must Produce

1. `train_notebook.ipynb` — structured notebook ready to run on Kaggle T4
2. `best_model.pth` — saved as a Kaggle dataset output artifact
3. `outputs/s4_training_logs.txt` — pasted W&B training curves summary

---

## Kaggle Notebook Structure

The notebook must follow this exact cell ordering:

```
[Markdown] # Section 1: Environment Setup
[Code]     # Install dependencies
[Code]     # Mount Kaggle datasets + W&B login

[Markdown] # Section 2: Data Loading
[Code]     # Load train.csv / val.csv, instantiate PollutionDataset

[Markdown] # Section 3: Model Initialization
[Code]     # Instantiate PollutionClassifier, print parameter count

[Markdown] # Section 4: Phase 1 Training (Frozen backbone, 2 epochs)
[Code]     # Training loop Phase 1

[Markdown] # Section 5: Phase 2 Training (Full finetune, 8 epochs)
[Code]     # Unfreeze, training loop Phase 2

[Markdown] # Section 6: Final Evaluation
[Code]     # Load best_model.pth, eval on val set, print Macro F1 + Hamming Loss

[Markdown] # Section 7: Save Artifacts
[Code]     # Save model, upload to W&B artifacts
```

---

## Environment Setup Cell

```python
!pip install timm albumentations wandb iterative-stratification -q

import wandb
wandb.login(key="YOUR_WANDB_KEY")  # add as Kaggle Secret

import torch
print(f"PyTorch: {torch.__version__}")
print(f"GPU available: {torch.cuda.is_available()}")
print(f"GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None'}")

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

---

## Training Hyperparameters

```python
CONFIG = {
    "backbone": "efficientnet_b0",
    "image_size": 224,
    "batch_size": 32,         # reduce to 16 if OOM
    "phase1_epochs": 2,
    "phase2_epochs": 8,
    "phase1_lr": 1e-3,
    "phase2_lr": 1e-4,
    "weight_decay": 1e-2,
    "num_labels": 4,
    "tabular_dim": 9,
    "threshold": 0.5,
}
wandb.init(project="ecoview-pollution-classifier", config=CONFIG)
```

---

## Expected Training Timeline on T4

| Phase | Epochs | Expected Duration |
|---|---|---|
| Phase 1 (frozen backbone) | 2 | ~10 min |
| Phase 2 (full finetune) | 8 | ~60 min |
| Final eval | — | ~5 min |
| Total | | ~75 min |

---

## Stop Conditions (When to Abort & Debug)

Watch W&B dashboard. If you see:
- `train/loss > 2.0` after epoch 1 → learning rate too high
- `val/macro_f1 < 0.3` after epoch 5 → label assignment bug in S1
- `val/macro_f1` flat while `train/macro_f1` keeps rising → overfitting, go to S5 early
- GPU OOM error → reduce `batch_size` to 16 and restart

---

## Artifacts to Save

```python
# At end of training:
torch.save(model.state_dict(), "/kaggle/working/best_model.pth")

artifact = wandb.Artifact("pollution-classifier-checkpoint", type="model")
artifact.add_file("/kaggle/working/best_model.pth")
wandb.log_artifact(artifact)

wandb.finish()
```

Also download the `.pth` from Kaggle output before the session expires.

---

## Handoff

Paste into `outputs/s4_training_logs.txt`:
```
Final val Macro F1:    ___
Final val Hamming Loss: ___
Best epoch:            ___
Total training time:   ___ min
GPU used:              T4 / P100 / other
W&B run URL:           https://wandb.ai/...
Checkpoint saved at:   /kaggle/working/best_model.pth
Overfitting observed?  Yes / No
```

Then start Session 05 with: `MASTER_PLAN.md` + `sessions/session_05_diagnostics.md` + `outputs/s4_training_logs.txt`
