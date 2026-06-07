# Running Decisions Log

This file tracks every architectural or operational decision made during the project.
Update it at the end of each session. Never delete entries — mark outdated ones as [SUPERSEDED].

---

## Locked Decisions (Pre-Session)

| ID | Decision | Rationale |
|---|---|---|
| D001 | Multi-label classification (not multi-class) | Indian scenes combine pollution types simultaneously |
| D002 | EfficientNet-B0 as vision backbone | Best accuracy/latency at 224×224 on CPU |
| D003 | Tabular metadata: 4 seasons + 5 AQI bins (9 features) | Fully synthetic, no external API dependency |
| D004 | BCEWithLogitsLoss | Standard for multi-label; numerically stable |
| D005 | Geometric augmentations only | Color jitter destroys smog/water color cues |
| D006 | Macro F1 + Hamming Loss as eval metrics | Accuracy is misleading for multi-label |
| D007 | Grad-CAM on EfficientNet-B0 `conv_head` layer | Last conv layer before GAP gives sharpest maps |
| D008 | PyTorch Dynamic int8 quantization on Linear layers | ~4x size reduction, acceptable accuracy loss for deployment |

---

## Session-Specific Decisions

### Session 01 Decisions
- Dataset sources chosen: ___ (fill after S1)
- Images removed due to corruption: ___
- Final dataset size: ___

### Session 02 Decisions
- Confirmed image resolution: ___ × ___
- Batch size confirmed: ___
- Any augmentation adjustments: ___

### Session 03 Decisions
- Backbone output dim: ___ (expected: 1280)
- Dry-run result: PASSED / FAILED
- Any architecture adjustments: ___

### Session 04 Decisions
- Training converged at epoch: ___
- Overfitting observed: Yes / No
- Best val Macro F1 achieved: ___

### Session 05 Decisions
- Grad-CAM visually correct: Yes / No
- Diagnostic case: A / B / C / D
- Fixes applied: ___

### Session 06 Decisions
- Quantized model size: ___ MB
- HF Space URL: ___
