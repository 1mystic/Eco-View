"""
build_dataset.py — Session 01: Data Assembly for Ecoview Pollution Classifier
Run this on a Kaggle CPU notebook (not GPU needed here).

BEFORE RUNNING:
1. Go to kaggle.com/settings → API → Create New Token → download kaggle.json
2. Upload kaggle.json as a Kaggle Secret named KAGGLE_KEY (or upload to /root/.kaggle/)
3. Fill in DATASET_SLUGS below with the actual Kaggle dataset identifiers
4. Add these datasets to your Kaggle notebook via: Notebook → Add Data → search and add
"""

# ==============================================================================
# SECTION 0: CONFIG — FILL THESE IN BEFORE RUNNING
# ==============================================================================

DATASET_SLUGS = {
    # HOW TO FIND: Go to kaggle.com, search the description below,
    # then copy the slug from the URL: kaggle.com/datasets/<slug>

    "air_pollution": "adityaankar/air-pollution-index-data-india-and-nepal",
    # Search: "air pollution image dataset india nepal"
    # Expect: images of smoggy skies, industrial haze over Indian/Nepali cities

    "land_pollution": "techsash/waste-classification-data",
    # Search: "waste classification outdoor garbage india"
    # Expect: outdoor garbage piles, landfill, roadside waste images
    # Alternative slugs to try if this fails:
    #   "mostafaabla/garbage-classification"
    #   "asdasdasasdas/realwaste-image-classification"

    "clean": "arnaud58/landscape-pictures",
    # Search: "india landscape clean nature cityscape"
    # Expect: clean skies, natural landscapes, clean streets
    # Alternative: "nitishabharathi/indian-cityscapes"
}

# Folder structure inside each downloaded dataset where images live
# If the dataset has a different folder structure, adjust these
DATASET_IMAGE_SUBDIR = {
    "air_pollution": "",       # root of the dataset, or e.g. "images/"
    "land_pollution": "",
    "clean": "",
}

# Label assignment per source
# Multi-label: a source can set multiple labels to 1
SOURCE_LABELS = {
    "air_pollution": {"Air_Pollution": 1, "Land_Pollution": 0, "Water_Pollution": 0, "Clean": 0},
    "land_pollution": {"Air_Pollution": 0, "Land_Pollution": 1, "Water_Pollution": 0, "Clean": 0},
    "clean":          {"Air_Pollution": 0, "Land_Pollution": 0, "Water_Pollution": 0, "Clean": 1},
}

# Image caps per source (prevents one source from dominating the dataset)
MAX_IMAGES_PER_SOURCE = 2000

BASE_DIR = "/kaggle/working/data"

# ==============================================================================
# SECTION 1: SETUP
# ==============================================================================

import subprocess, sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package, "-q"])

install("iterative-stratification")
install("imagehash")

import os, shutil, random, json
import numpy as np
import pandas as pd
from PIL import Image, ImageFile
import imagehash
from iterstrat.ml_stratifiers import MultilabelStratifiedShuffleSplit

ImageFile.LOAD_TRUNCATED_IMAGES = False  # we want to catch truncated images as corrupt

random.seed(42)
np.random.seed(42)

os.makedirs(f"{BASE_DIR}/images", exist_ok=True)
os.makedirs(f"{BASE_DIR}/raw", exist_ok=True)

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MIN_DIM = 80       # drop images smaller than 80×80
MIN_FILE_BYTES = 5_000  # drop files smaller than 5KB (likely corrupt)

print("=" * 60)
print("Ecoview — Session 01: Data Assembly")
print("=" * 60)

# ==============================================================================
# SECTION 2: KAGGLE AUTH CHECK
# ==============================================================================

# Kaggle API key should already be at /root/.kaggle/kaggle.json
# when added as a Kaggle Secret named KAGGLE_USERNAME + KAGGLE_KEY,
# OR you can mount your own kaggle.json here:

kaggle_dir = os.path.expanduser("~/.kaggle")
kaggle_json = os.path.join(kaggle_dir, "kaggle.json")

if not os.path.exists(kaggle_json):
    # Try reading from Kaggle Secrets (set KAGGLE_USERNAME and KAGGLE_KEY as secrets)
    import os
    username = os.environ.get("KAGGLE_USERNAME", "")
    key = os.environ.get("KAGGLE_KEY", "")
    if username and key:
        os.makedirs(kaggle_dir, exist_ok=True)
        with open(kaggle_json, "w") as f:
            json.dump({"username": username, "key": key}, f)
        os.chmod(kaggle_json, 0o600)
        print("Kaggle credentials loaded from environment.")
    else:
        raise RuntimeError(
            "No Kaggle credentials found. "
            "Add KAGGLE_USERNAME and KAGGLE_KEY as Kaggle Secrets, or upload kaggle.json."
        )
else:
    print("Kaggle credentials found.")

# ==============================================================================
# SECTION 3: DOWNLOAD DATASETS
# ==============================================================================

from kaggle.api.kaggle_api_extended import KaggleApiExtended
api = KaggleApiExtended()
api.authenticate()

def download_dataset(slug: str, dest: str):
    """Download a Kaggle dataset and unzip to dest/."""
    os.makedirs(dest, exist_ok=True)
    owner, name = slug.split("/")
    print(f"\nDownloading: {slug} → {dest}")
    api.dataset_download_files(slug, path=dest, unzip=True, quiet=False)
    print(f"Download complete: {dest}")

for source_name, slug in DATASET_SLUGS.items():
    raw_dest = f"{BASE_DIR}/raw/{source_name}"
    if os.path.exists(raw_dest) and len(os.listdir(raw_dest)) > 0:
        print(f"Already downloaded: {source_name}, skipping.")
    else:
        download_dataset(slug, raw_dest)

# ==============================================================================
# SECTION 4: DISCOVER IMAGES PER SOURCE
# ==============================================================================

def find_images(root: str) -> list[str]:
    """Recursively find all image files under root."""
    paths = []
    for dirpath, _, filenames in os.walk(root):
        for fname in filenames:
            if os.path.splitext(fname)[1].lower() in VALID_EXTENSIONS:
                paths.append(os.path.join(dirpath, fname))
    return paths

source_image_paths = {}
for source_name in DATASET_SLUGS:
    search_root = os.path.join(f"{BASE_DIR}/raw/{source_name}", DATASET_IMAGE_SUBDIR[source_name])
    paths = find_images(search_root)
    random.shuffle(paths)
    paths = paths[:MAX_IMAGES_PER_SOURCE]
    source_image_paths[source_name] = paths
    print(f"Found {len(paths)} images for source: {source_name}")

# ==============================================================================
# SECTION 5: VALIDATE & FILTER IMAGES
# ==============================================================================

def is_valid_image(path: str) -> tuple[bool, str]:
    """
    Returns (is_valid, reason).
    Checks: file size, decodable, RGB (not grayscale), minimum dimensions.
    """
    if os.path.getsize(path) < MIN_FILE_BYTES:
        return False, "too_small_file"
    try:
        with Image.open(path) as img:
            img.verify()           # catches truncation
    except Exception:
        return False, "corrupt_verify"
    try:
        with Image.open(path) as img:
            img.load()             # actually decode pixels
            if img.mode not in ("RGB", "RGBA"):
                return False, f"wrong_mode_{img.mode}"
            w, h = img.size
            if w < MIN_DIM or h < MIN_DIM:
                return False, f"too_small_dim_{w}x{h}"
    except Exception:
        return False, "corrupt_load"
    return True, "ok"

print("\nValidating images...")
valid_records = []
removed_stats = {}

for source_name, paths in source_image_paths.items():
    labels = SOURCE_LABELS[source_name]
    valid_count = 0
    for src_path in paths:
        ok, reason = is_valid_image(src_path)
        if not ok:
            removed_stats[reason] = removed_stats.get(reason, 0) + 1
            continue

        # Copy image to unified data/images/ with a unique name
        ext = os.path.splitext(src_path)[1].lower()
        dest_name = f"{source_name}_{valid_count:05d}{ext}"
        dest_path = f"{BASE_DIR}/images/{dest_name}"
        shutil.copy2(src_path, dest_path)

        record = {"image_path": dest_path, **labels, "source": source_name}
        valid_records.append(record)
        valid_count += 1

    print(f"  {source_name}: {valid_count} valid images kept")

print(f"\nRemoval reasons: {removed_stats}")

# ==============================================================================
# SECTION 6: NEAR-DUPLICATE REMOVAL (perceptual hash)
# ==============================================================================

print("\nRemoving near-duplicates (perceptual hash)...")

seen_hashes = set()
dedup_records = []
dup_count = 0

for record in valid_records:
    try:
        with Image.open(record["image_path"]) as img:
            h = str(imagehash.phash(img))
    except Exception:
        continue
    if h in seen_hashes:
        dup_count += 1
        os.remove(record["image_path"])
    else:
        seen_hashes.add(h)
        dedup_records.append(record)

print(f"Duplicates removed: {dup_count}")
print(f"Unique images remaining: {len(dedup_records)}")

# ==============================================================================
# SECTION 7: SYNTHETIC TABULAR METADATA GENERATION
# ==============================================================================
#
# 9-feature one-hot vector:
#   [season_monsoon, season_summer, season_winter, season_post_monsoon,
#    aqi_good, aqi_moderate, aqi_unhealthy, aqi_very_unhealthy, aqi_hazardous]
#
# Generation rules (probabilistic, based on label):
#   Air_Pollution=1  → winter/post_monsoon (70%), aqi_unhealthy/very_unhealthy/hazardous (85%)
#   Land_Pollution=1 → any season uniform,         aqi_moderate/unhealthy (70%)
#   Water_Pollution=1→ monsoon (50%),               aqi_moderate (50%)
#   Clean=1          → summer/monsoon (75%),        aqi_good/moderate (90%)
#
# When multiple labels are 1, the highest-pollution label wins.
# ==============================================================================

SEASONS = ["monsoon", "summer", "winter", "post_monsoon"]
AQI_BINS = ["good", "moderate", "unhealthy", "very_unhealthy", "hazardous"]

SEASON_PROBS = {
    "air":   [0.15, 0.10, 0.40, 0.35],   # prefers winter/post_monsoon
    "land":  [0.25, 0.25, 0.25, 0.25],   # uniform
    "water": [0.50, 0.20, 0.15, 0.15],   # prefers monsoon
    "clean": [0.35, 0.40, 0.15, 0.10],   # prefers summer/monsoon
}
AQI_PROBS = {
    "air":   [0.03, 0.12, 0.35, 0.35, 0.15],  # mostly unhealthy+
    "land":  [0.05, 0.30, 0.40, 0.20, 0.05],  # moderate/unhealthy
    "water": [0.10, 0.40, 0.30, 0.15, 0.05],  # moderate
    "clean": [0.50, 0.40, 0.08, 0.02, 0.00],  # good/moderate
}

def dominant_label(record: dict) -> str:
    """Return the highest-priority pollution label for metadata generation."""
    if record["Air_Pollution"]:   return "air"
    if record["Water_Pollution"]: return "water"
    if record["Land_Pollution"]:  return "land"
    return "clean"

def generate_metadata(record: dict) -> dict:
    dom = dominant_label(record)
    season = np.random.choice(SEASONS, p=SEASON_PROBS[dom])
    aqi    = np.random.choice(AQI_BINS, p=AQI_PROBS[dom])

    season_vec = {f"season_{s}": int(s == season) for s in SEASONS}
    aqi_vec    = {f"aqi_{a}":    int(a == aqi)    for a in AQI_BINS}
    return {**season_vec, **aqi_vec}

for record in dedup_records:
    meta = generate_metadata(record)
    record.update(meta)

# ==============================================================================
# SECTION 8: STRATIFIED 80/20 TRAIN / VAL SPLIT
# ==============================================================================

df = pd.DataFrame(dedup_records)
LABEL_COLS = ["Air_Pollution", "Land_Pollution", "Water_Pollution", "Clean"]

X = df.index.values.reshape(-1, 1)
y = df[LABEL_COLS].values

msss = MultilabelStratifiedShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
train_idx, val_idx = next(msss.split(X, y))

train_df = df.iloc[train_idx].reset_index(drop=True)
val_df   = df.iloc[val_idx].reset_index(drop=True)

train_df.to_csv(f"{BASE_DIR}/train.csv", index=False)
val_df.to_csv(f"{BASE_DIR}/val.csv",   index=False)

print(f"\nSplit complete: {len(train_df)} train | {len(val_df)} val")

# ==============================================================================
# SECTION 9: REPORT
# ==============================================================================

print("\n" + "=" * 60)
print("DATASET REPORT — paste this into outputs/s1_dataset_stats.txt")
print("=" * 60)

total = len(df)
print(f"Total images:               {total}")
print(f"Train images:               {len(train_df)}")
print(f"Val images:                 {len(val_df)}")
print(f"Corrupted/removed:          {sum(removed_stats.values())} ({removed_stats})")
print(f"Duplicates removed:         {dup_count}")
print()

for label in LABEL_COLS:
    count = int(df[label].sum())
    pct   = 100 * count / total
    print(f"{label:<22} count: {count:>5}  ({pct:.1f}%)")

multi_label_count = int((df[LABEL_COLS].sum(axis=1) >= 2).sum())
print(f"\nMulti-label (2+ labels):    {multi_label_count} ({100*multi_label_count/total:.1f}%)")

print("\nSeason distribution (train):")
for s in SEASONS:
    col = f"season_{s}"
    if col in train_df.columns:
        print(f"  {s:<15} {int(train_df[col].sum()):>5}")

print("\nAQI distribution (train):")
for a in AQI_BINS:
    col = f"aqi_{a}"
    if col in train_df.columns:
        print(f"  {a:<15} {int(train_df[col].sum()):>5}")

print("\nFiles saved:")
print(f"  {BASE_DIR}/train.csv")
print(f"  {BASE_DIR}/val.csv")
print(f"  {BASE_DIR}/images/  ({total} images)")
print("=" * 60)
print("Session 01 COMPLETE. Proceed to Session 02.")
