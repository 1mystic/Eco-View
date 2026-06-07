# Session 01 — Data Assembly & Dataset Compilation

**Role:** Data Assembly & Profiling Specialist (Agent 1)

**Deliverable:** `build_dataset.py` — a single runnable script that downloads, merges, labels, and structures the full dataset on a Kaggle CPU notebook.

---

## What This Session Must Produce

1. A Python script (`build_dataset.py`) that:
   - Downloads 3 Kaggle datasets via the Kaggle API
   - Merges them into a unified folder: `data/images/`
   - Creates `data/metadata.csv` with columns: `image_path, Air_Pollution, Land_Pollution, Water_Pollution, Clean, season, aqi_bin`
   - Generates synthetic tabular metadata based on label context
   - Removes corrupted/grayscale images
   - Creates stratified 80/20 train/val split
2. A short printout at the end showing class distribution counts

---

## Architecture Context (Read Before Coding)

**Model inputs:**
- Image: 224×224 RGB → EfficientNet-B0 backbone
- Tabular vector: 9 floats → 2-layer MLP

**Labels (multi-label, not mutually exclusive):**
- `Air_Pollution` — visible haze, smog, smoke stacks
- `Land_Pollution` — garbage piles, open landfill, roadside waste
- `Water_Pollution` — discolored water, floating waste, industrial discharge
- `Clean` — clear skies, clean streets, natural landscapes

**Tabular metadata vector (9 features, synthetically generated):**
```
[season_monsoon, season_summer, season_winter, season_post_monsoon,   # one-hot
 aqi_good, aqi_moderate, aqi_unhealthy, aqi_very_unhealthy, aqi_hazardous]  # one-hot
```

**Synthetic generation rules:**
| Label | Season assignment | AQI bin |
|---|---|---|
| Air_Pollution | winter or post_monsoon (70%) | unhealthy–hazardous |
| Land_Pollution | any season uniform | moderate–unhealthy |
| Water_Pollution | monsoon (50%) | moderate |
| Clean | summer or monsoon | good–moderate |
| Mixed labels | weighted average of above | higher label wins |

---

## Kaggle Datasets to Download

1. **Air Pollution (India/Nepal):**
   - Search: `"air pollution image dataset india"` on Kaggle
   - Label mapping: all images → `Air_Pollution=1, Clean=0`

2. **Waste/Land Pollution:**
   - Search: `"waste classification dataset"` or `"realwaste"` on Kaggle
   - Filter for: outdoor/open-dump scenes (not indoor recycling bins)
   - Label mapping: outdoor waste images → `Land_Pollution=1`

3. **Clean Baseline:**
   - Search: `"indian cityscape clean"` or `"nature landscape india"` on Kaggle
   - Label mapping: → `Clean=1`, all pollution = 0

> NOTE: If a specific dataset is unavailable, use the closest available substitute and document the choice in `context/decisions.md`.

---

## Script Requirements

```python
# build_dataset.py
# Sections to implement:

# 1. SETUP — install kaggle, authenticate with kaggle.json
# 2. DOWNLOAD — download each dataset to data/raw/
# 3. FILTER — remove corrupted, grayscale, <50×50px images using Pillow
# 4. LABEL — assign multi-label binary vectors per image
# 5. METADATA — synthetically generate season + aqi_bin per image
# 6. SPLIT — stratified 80/20 split using sklearn's MultilabelStratifiedKFold
#             (use iterstrat library: pip install iterative-stratification)
# 7. EXPORT — save data/train.csv and data/val.csv
# 8. REPORT — print class counts and co-occurrence matrix
```

**Target dataset size:** 2,000–5,000 images minimum. If smaller, apply augmentation at training time.

**Class balance target:** No single label should exceed 50% of the dataset.

---

## Constraints & Guardrails

- Do NOT use color jitter or grayscale conversion (destroys pollution color cues)
- DO check for and remove near-duplicate images using perceptual hashing (`imagehash` library) if dataset has obvious duplicates
- DO ensure `Clean` images have no pollution labels set to 1

---

## Handoff

When done, paste the following into `outputs/s1_dataset_stats.txt`:
```
Total images: ___
Train images: ___
Val images: ___
Air_Pollution count: ___
Land_Pollution count: ___
Water_Pollution count: ___
Clean count: ___
Multi-label (2+ labels) count: ___
Corrupted/removed: ___
```

Then start Session 02 with: `MASTER_PLAN.md` + `sessions/session_02_eda.md` + `outputs/s1_dataset_stats.txt`
