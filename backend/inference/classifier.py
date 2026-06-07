"""
Classifier component — forwards classification requests to the EcoView ML microservice,
with a graceful local fallback if the microservice is offline.
"""

import hashlib
import time
import httpx
from ..core.config import settings

LABELS = [
    "garbage_dump",
    "plastic_waste",
    "industrial_smoke",
    "water_contamination",
    "deforestation",
    "oil_spill",
]

SEVERITY_MAP = {
    "garbage_dump": "medium",
    "plastic_waste": "medium",
    "industrial_smoke": "high",
    "water_contamination": "high",
    "deforestation": "high",
    "oil_spill": "critical",
}

MODEL_VERSION = "stub-v0.0 (fallback)"


def classify_image(image_url: str) -> dict:
    """
    Forwards classification requests to the external ML microservice.
    If the service is down, falls back deterministically based on image URL hash.
    """
    start = time.perf_counter()

    try:
        # Attempt to call the ML microservice
        # Use a reasonable timeout (e.g. 20s) since Gemini VLM validation can take up to ~5-10s
        payload = {"image_url": image_url}
        response = httpx.post(
            f"{settings.ML_BACKEND_URL}/inference/classify",
            json=payload,
            timeout=20.0
        )
        response.raise_for_status()
        res_data = response.json()
        
        # Ensure we return the expected keys matching the database schema requirements
        return {
            "label": res_data["label"],
            "confidence": res_data["confidence"],
            "severity": res_data["severity"],
            "processing_time_ms": res_data["processing_time_ms"],
            "model_version": res_data["model_version"]
        }
        
    except Exception as e:
        print(f"[!] ML microservice call failed: {e}. Executing local fallback.")
        
        # Graceful local fallback (deterministic hash of URL)
        digest = int(hashlib.md5(image_url.encode()).hexdigest(), 16)
        label = LABELS[digest % len(LABELS)]
        confidence = 0.65 + (digest % 30) / 100  # 0.65 – 0.94
        severity = SEVERITY_MAP[label]

        elapsed_ms = int((time.perf_counter() - start) * 1000)

        return {
            "label": label,
            "confidence": round(confidence, 3),
            "severity": severity,
            "processing_time_ms": max(elapsed_ms, 1),
            "model_version": f"{MODEL_VERSION} (Service down fallback)"
        }
