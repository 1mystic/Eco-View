"""
EcoView — Local ONNX Export Script
student_best.pth  →  student.onnx  →  simplified  →  student_model_quantized.onnx

Requirements (install once):
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
    pip install timm onnx onnxsim onnxruntime

    NOTE: The CPU-only torch wheel is ~250 MB (vs ~2 GB for CUDA).
    If you already have torch+CUDA installed, this script still works — it runs on CPU.

Usage:
    python notebooks/export_onnx_local.py

Inputs  (notebooks/OUTPUT/):
    student_best.pth      — downloaded from Kaggle output
    class_mapping.json    — downloaded from Kaggle output

Outputs (notebooks/OUTPUT/):
    student.onnx                    FP32 ONNX (single-file, ~16 MB)
    student_simplified.onnx         onnxsim-optimised (~16 MB)
    student_model_quantized.onnx    INT8 dynamic quant (~6 MB) ← deploy this
"""

import sys
import json
import time
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
OUTPUT_DIR   = SCRIPT_DIR / 'OUTPUT'
STUDENT_PTH  = OUTPUT_DIR / 'student_best.pth'
CLASS_MAP    = OUTPUT_DIR / 'class_mapping.json'
ONNX_RAW     = OUTPUT_DIR / 'student.onnx'
ONNX_SIMP    = OUTPUT_DIR / 'student_simplified.onnx'
ONNX_INT8    = OUTPUT_DIR / 'student_model_quantized.onnx'

NUM_CLASSES  = 6
IMG_SIZE     = 224

# ── Dependency check ─────────────────────────────────────────────────────────
def _check_deps():
    needed = {'torch': 'torch', 'timm': 'timm', 'onnx': 'onnx', 'onnxruntime': 'onnxruntime'}
    missing = [pkg for pkg in needed if not _importable(pkg)]
    if missing:
        print("Missing packages. Install with:")
        print(f"  pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu")
        print(f"  pip install {' '.join(missing)} onnxsim")
        sys.exit(1)

def _importable(name):
    try:
        __import__(name)
        return True
    except ImportError:
        return False

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    _check_deps()

    import numpy as np
    import torch
    import timm
    import onnx
    import onnxruntime as ort

    print("EcoView — Local ONNX Export Pipeline")
    print("=" * 52)

    # Verify required inputs
    if not STUDENT_PTH.exists():
        print(f"\nERROR: {STUDENT_PTH} not found.")
        print("Download student_best.pth from your Kaggle output tab.")
        sys.exit(1)

    print(f"Input:  {STUDENT_PTH.name}  ({STUDENT_PTH.stat().st_size/1e6:.1f} MB)")

    if CLASS_MAP.exists():
        with open(CLASS_MAP, encoding='utf-8') as f:
            mapping = json.load(f)
        idx_to_class = mapping.get('idx_to_class', {})
        print(f"Input:  {CLASS_MAP.name}  — classes: {list(mapping.get('class_to_idx', {}).keys())}")
    else:
        print(f"WARN:   class_mapping.json not found — inference test will show class indices")
        idx_to_class = {}

    # ── Step 1: Load model on CPU ──────────────────────────────────────────
    print("\n[1/4] Loading MobileNetV3 Large on CPU...")
    t0 = time.perf_counter()

    student = timm.create_model('mobilenetv3_large_100', pretrained=False, num_classes=NUM_CLASSES)
    student.load_state_dict(torch.load(str(STUDENT_PTH), map_location='cpu', weights_only=True))
    student.eval()

    params_m = sum(p.numel() for p in student.parameters()) / 1e6
    mem_mb   = sum(p.numel() * p.element_size() for p in student.parameters()) / 1e6
    print(f"  {params_m:.1f}M params | ~{mem_mb:.0f} MB in RAM | {time.perf_counter()-t0:.1f}s")

    # ── Step 2: Export to ONNX ────────────────────────────────────────────
    print("\n[2/4] Exporting to ONNX (opset 17, single-file)...")
    t0 = time.perf_counter()

    dummy = torch.randn(1, 3, IMG_SIZE, IMG_SIZE)
    torch.onnx.export(
        student, dummy, str(ONNX_RAW),
        opset_version=17,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch'}, 'output': {0: 'batch'}},
        export_params=True,
        dynamo=False,  # use legacy TorchScript exporter — stable, no onnxscript quirks
    )

    model_onnx = onnx.load(str(ONNX_RAW))
    onnx.checker.check_model(model_onnx)
    print(f"  {ONNX_RAW.name}  ({ONNX_RAW.stat().st_size/1e6:.1f} MB)  OK  [{time.perf_counter()-t0:.1f}s]")

    # ── Step 3: Simplify ──────────────────────────────────────────────────
    print("\n[3/4] Simplifying with onnxsim...")
    t0 = time.perf_counter()
    simp_path = ONNX_RAW  # fallback

    if _importable('onnxsim'):
        try:
            from onnxsim import simplify
            simplified, ok = simplify(model_onnx)
            if ok:
                onnx.save(simplified, str(ONNX_SIMP))
                simp_path = ONNX_SIMP
                print(f"  {ONNX_SIMP.name}  ({ONNX_SIMP.stat().st_size/1e6:.1f} MB)  OK  [{time.perf_counter()-t0:.1f}s]")
            else:
                print(f"  onnxsim check failed — using raw ONNX for quantization")
        except Exception as e:
            print(f"  onnxsim error ({e}) — using raw ONNX for quantization")
    else:
        print("  onnxsim not installed — skipping (pip install onnxsim to enable)")
        print(f"  Using: {simp_path.name}")

    # ── Step 4: INT8 dynamic quantization ────────────────────────────────
    print("\n[4/4] INT8 dynamic quantization...")
    t0 = time.perf_counter()

    from onnxruntime.quantization import quantize_dynamic, QuantType
    quantize_dynamic(
        model_input=str(simp_path),
        model_output=str(ONNX_INT8),
        weight_type=QuantType.QInt8,
    )
    print(f"  {ONNX_INT8.name}  ({ONNX_INT8.stat().st_size/1e6:.1f} MB)  OK  [{time.perf_counter()-t0:.1f}s]")

    # Size reduction
    fp32_mb = ONNX_SIMP.stat().st_size/1e6 if ONNX_SIMP.exists() else ONNX_RAW.stat().st_size/1e6
    int8_mb = ONNX_INT8.stat().st_size/1e6
    print(f"  Size reduction: {fp32_mb:.1f} MB → {int8_mb:.1f} MB  ({(1-int8_mb/fp32_mb)*100:.0f}% smaller)")

    # ── Validation ───────────────────────────────────────────────────────
    print("\n[Validation] Inference test on random input...")
    session = ort.InferenceSession(str(ONNX_INT8), providers=['CPUExecutionProvider'])
    iname   = session.get_inputs()[0].name
    test_np = __import__('numpy').random.randn(1, 3, IMG_SIZE, IMG_SIZE).astype('float32')

    t0  = time.perf_counter()
    out = session.run(None, {iname: test_np})[0]
    lat = (time.perf_counter() - t0) * 1000

    pred_idx  = int(out.argmax(1)[0])
    pred_name = idx_to_class.get(str(pred_idx), f'class_{pred_idx}')
    print(f"  Output shape: {out.shape}  |  pred: {pred_name} (idx={pred_idx})  |  latency: {lat:.1f} ms  OK")

    # ── Summary ──────────────────────────────────────────────────────────
    print("\n" + "=" * 52)
    print("COMPLETE — output files:")
    for p in [ONNX_RAW, ONNX_SIMP, ONNX_INT8]:
        if p.exists():
            tag = "  ← DEPLOY THIS" if p == ONNX_INT8 else ""
            print(f"  {p.name:<40} {p.stat().st_size/1e6:5.1f} MB{tag}")

    print(f"""
Next steps:
  1. Copy notebooks/OUTPUT/student_model_quantized.onnx
       → ecoview-ml-backend/student_model_quantized.onnx
  2. Update LABELS + SEVERITY_MAP in ecoview-ml-backend/core/inference.py
       (see class_mapping.json for the correct class order)
  3. Push ecoview-ml-backend/ to HuggingFace Space
""")

if __name__ == '__main__':
    main()
