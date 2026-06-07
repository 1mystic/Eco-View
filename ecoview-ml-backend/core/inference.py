import os
import time
import hashlib
import io
from typing import Dict, Any, Tuple
from PIL import Image
import httpx

from core.utils import validate_url_for_ssrf

# Suppress ONNX runtime warnings/logs unless severe
os.environ["ORT_LOGGING_LEVEL"] = "3"

# TrashNet classes — order matches student_model_quantized.onnx (class_mapping.json)
LABELS = [
    "cardboard",   # idx 0
    "glass",       # idx 1
    "metal",       # idx 2
    "paper",       # idx 3
    "plastic",     # idx 4
    "trash",       # idx 5
]

SEVERITY_MAP = {
    "cardboard": "low",
    "glass":     "medium",
    "metal":     "medium",
    "paper":     "low",
    "plastic":   "high",
    "trash":     "high",
}

DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "student_model_quantized.onnx"
)

class ONNXStudentClassifier:
    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        self.model_path = model_path
        self.session = None
        self.input_name = None
        self.output_name = None
        self.is_simulator = False
        
        # Load ONNX model if available, else fall back to simulator
        if os.path.exists(self.model_path):
            try:
                import onnxruntime as ort
                # Use CPU execution provider for commodity CPU edge device setup
                self.session = ort.InferenceSession(
                    self.model_path, 
                    providers=['CPUExecutionProvider']
                )
                self.input_name = self.session.get_inputs()[0].name
                self.output_name = self.session.get_outputs()[0].name
                print(f"[+] Loaded ONNX student model from: {self.model_path}")
            except Exception as e:
                print(f"[!] Error loading ONNX model: {e}. Falling back to simulation mode.")
                self.is_simulator = True
        else:
            print(f"[!] ONNX model not found at {self.model_path}. Running in simulator fallback mode.")
            self.is_simulator = True

    def _download_image(self, image_url: str) -> Image.Image:
        """Download image from URL and return as PIL Image."""
        if image_url.startswith(("http://", "https://")):
            # Validate URL to prevent SSRF
            validate_url_for_ssrf(image_url)
            response = httpx.get(image_url, timeout=10.0)
            response.raise_for_status()
            return Image.open(io.BytesIO(response.content))
        else:
            # Assume local file path
            return Image.open(image_url)

    def _preprocess(self, img: Image.Image):
        """Preprocess PIL image to ONNX input format: float32, normalized CHW format [1, 3, 224, 224]."""
        import numpy as np
        if img.mode != "RGB":
            img = img.convert("RGB")
        img = img.resize((224, 224), Image.Resampling.BILINEAR)
        img_arr = np.array(img).astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img_arr = (img_arr - mean) / std
        img_arr = img_arr.transpose(2, 0, 1)
        img_arr = np.expand_dims(img_arr, axis=0)
        return img_arr

    def _softmax(self, x):
        """Compute softmax values."""
        import numpy as np
        e_x = np.exp(x - np.max(x, axis=-1, keepdims=True))
        return e_x / e_x.sum(axis=-1, keepdims=True)

    def _simulate_inference(self, image_url: str) -> Tuple[str, float]:
        """Generate a smart deterministic prediction based on image URL hash."""
        digest = int(hashlib.md5(image_url.encode()).hexdigest(), 16)
        label = LABELS[digest % len(LABELS)]
        # Map some variance in confidence
        confidence = 0.55 + (digest % 40) / 100  # 0.55 – 0.95
        return label, round(confidence, 3)

    def classify(self, image_url: str) -> Dict[str, Any]:
        """Classify the given image URL using ONNX model or Simulator fallback."""
        start_time = time.perf_counter()
        
        if self.is_simulator:
            # Simulate a small download and processing overhead
            time.sleep(0.015)  # ~15ms processing latency
            label, confidence = self._simulate_inference(image_url)
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            return {
                "label": label,
                "confidence": confidence,
                "severity": SEVERITY_MAP[label],
                "processing_time_ms": max(elapsed_ms, 1),
                "model_version": "student-simulator-v1.0",
                "inference_mode": "simulator"
            }
            
        try:
            # Download and preprocess image
            img = self._download_image(image_url)
            input_tensor = self._preprocess(img)
            
            # Run inference
            outputs = self.session.run([self.output_name], {self.input_name: input_tensor})
            logits = outputs[0]
            
            # Postprocess predictions
            import numpy as np
            probabilities = self._softmax(logits)[0]
            class_idx = int(np.argmax(probabilities))
            label = LABELS[class_idx]
            confidence = float(probabilities[class_idx])
            
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            
            return {
                "label": label,
                "confidence": round(confidence, 3),
                "severity": SEVERITY_MAP[label],
                "processing_time_ms": max(elapsed_ms, 1),
                "model_version": "mambavision-student-int8",
                "inference_mode": "onnx"
            }
        except Exception as e:
            # Graceful fallback on any network or processing failure
            print(f"[!] Inference exception: {e}. Executing simulator fallback.")
            label, confidence = self._simulate_inference(image_url)
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            return {
                "label": label,
                "confidence": confidence,
                "severity": SEVERITY_MAP[label],
                "processing_time_ms": max(elapsed_ms, 1),
                "model_version": "student-simulator-fallback-v1.0",
                "inference_mode": "simulator_fallback"
            }
