import os
import base64
import json
import hashlib
import io
from typing import Dict, Any, Optional
import httpx
from PIL import Image

from core.utils import validate_url_for_ssrf

FLYWHEEL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "flywheel"
)

# Ensure the flywheel data directory exists
os.makedirs(FLYWHEEL_DIR, exist_ok=True)

class VLMTeacherValidator:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            print("[!] GEMINI_API_KEY environment variable not found. VLM Teacher will run in simulated mode.")

    def _get_image_bytes_and_mime(self, image_source: str) -> tuple[bytes, str]:
        """Download or read image and return raw bytes and mime type."""
        if image_source.startswith("data:"):
            # data URL: data:image/jpeg;base64,<data>
            header, b64data = image_source.split(",", 1)
            mime_type = header.split(":")[1].split(";")[0]
            return base64.b64decode(b64data), mime_type
        elif image_source.startswith(("http://", "https://")):
            validate_url_for_ssrf(image_source)
            response = httpx.get(image_source, timeout=15.0)
            response.raise_for_status()
            image_bytes = response.content
            raw_ct = response.headers.get("content-type", "image/jpeg")
            content_type = raw_ct.split(";")[0].strip()
            return image_bytes, content_type
        else:
            # Raw base64 string (no data: prefix) or file path
            try:
                image_bytes = base64.b64decode(image_source)
                return image_bytes, "image/jpeg"
            except Exception:
                with open(image_source, "rb") as f:
                    image_bytes = f.read()
                ext = os.path.splitext(image_source)[1].lower()
                return image_bytes, "image/png" if ext == ".png" else "image/jpeg"

    def _save_to_flywheel(self, image_bytes: bytes, mime_type: str, label_data: dict) -> str:
        """Saves the image and structured JSON label to the local data flywheel for retraining."""
        # Generate hash based on image contents
        img_hash = hashlib.sha256(image_bytes).hexdigest()[:16]
        
        ext = "png" if "png" in mime_type else "jpg"
        img_path = os.path.join(FLYWHEEL_DIR, f"{img_hash}.{ext}")
        json_path = os.path.join(FLYWHEEL_DIR, f"{img_hash}.json")
        
        # Save image
        with open(img_path, "wb") as f:
            f.write(image_bytes)
            
        # Save structured label
        with open(json_path, "w") as f:
            json.dump(label_data, f, indent=2)
            
        return img_hash

    def _gemini_post(self, prompt: str, schema: dict, image_bytes: bytes = None, mime_type: str = None) -> Dict[str, Any]:
        """Shared Gemini REST call. Adds inlineData only when image_bytes is provided."""
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={self.api_key}"
        parts = [{"text": prompt}]
        if image_bytes is not None:
            parts.append({"inlineData": {"mimeType": mime_type, "data": base64.b64encode(image_bytes).decode()}})
        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {"responseMimeType": "application/json", "responseSchema": schema, "temperature": 0.1},
        }
        with httpx.Client() as client:
            r = client.post(api_url, json=payload, headers={"Content-Type": "application/json"}, timeout=30.0)
            r.raise_for_status()
        content = r.json()["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(content.strip())

    _SCHEMA = {
        "type": "OBJECT",
        "properties": {
            "is_pollution": {"type": "BOOLEAN"},
            "category": {"type": "STRING", "enum": ["garbage_dump", "plastic_waste", "industrial_smoke", "water_contamination", "deforestation", "oil_spill", "none"]},
            "confidence": {"type": "NUMBER"},
            "reason": {"type": "STRING"},
        },
        "required": ["is_pollution", "category", "confidence", "reason"],
    }

    def validate_text(self, text_description: str) -> Dict[str, Any]:
        """Classify a pollution report using text description only (no image)."""
        import time
        if not self.api_key:
            time.sleep(0.3)
            digest = int(hashlib.md5(text_description.encode()).hexdigest(), 16)
            cats = ["garbage_dump", "plastic_waste", "industrial_smoke", "water_contamination", "deforestation", "oil_spill"]
            cat = cats[digest % len(cats)]
            return {
                "success": True, "simulated": True, "flywheel_logged": False,
                "teacher_decision": {
                    "is_pollution": True, "category": cat,
                    "confidence": round(0.72 + (digest % 15) / 100, 2),
                    "reason": f"[SIMULATED TEXT] Description suggests {cat.replace('_', ' ')}.",
                },
            }
        try:
            prompt = (
                f"Classify this environmental pollution incident report based on the text description.\n\n"
                f"Description: {text_description}\n\n"
                "Identify whether this is a pollution incident and classify it into one of the categories: "
                "garbage_dump, plastic_waste, industrial_smoke, water_contamination, deforestation, oil_spill, or none."
            )
            label_data = self._gemini_post(prompt, self._SCHEMA)
            return {"success": True, "teacher_decision": label_data, "simulated": False, "flywheel_logged": False}
        except Exception as e:
            return {"success": False, "error": str(e), "simulated": False}

    def validate_image(self, image_source: str) -> Dict[str, Any]:
        """
        Sends the image to the Gemini 3.1 Flash-Lite VLM API using a structured JSON prompt,
        checks if it constitutes pollution, identifies the type, and appends high-confidence
        results to the local data flywheel.
        """
        try:
            image_bytes, mime_type = self._get_image_bytes_and_mime(image_source)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to load image: {str(e)}",
                "simulated": False
            }

        # If no API key, execute high-quality simulated response (zero-cost demo friendly)
        if not self.api_key:
            # Simulate network latency of VLM (e.g. 800ms)
            import time
            time.sleep(0.8)
            
            # Deterministic mock label based on image source
            digest = int(hashlib.md5(image_source.encode()).hexdigest(), 16)
            categories = ["garbage_dump", "plastic_waste", "industrial_smoke", "water_contamination", "deforestation", "oil_spill"]
            category = categories[digest % len(categories)]
            
            mock_label = {
                "is_pollution": True,
                "category": category,
                "confidence": round(0.88 + (digest % 10) / 100, 2),
                "reason": f"[SIMULATED VLM] Clear visual evidence of {category.replace('_', ' ')} detected in the center of the image."
            }
            
            # Save to local data flywheel even in simulated mode for demonstration
            self._save_to_flywheel(image_bytes, mime_type, mock_label)
            
            return {
                "success": True,
                "teacher_decision": mock_label,
                "simulated": True,
                "flywheel_logged": True
            }

        prompt = (
            "Analyze this environmental hazard report photo. "
            "Determine if it contains environmental pollution/ecological hazards. "
            "Classify the category into one of these: garbage_dump, plastic_waste, "
            "industrial_smoke, water_contamination, deforestation, oil_spill, or none."
        )

        try:
            label_data = self._gemini_post(prompt, self._SCHEMA, image_bytes, mime_type)
            flywheel_logged = False
            if label_data.get("is_pollution") and label_data.get("confidence", 0.0) >= 0.85:
                self._save_to_flywheel(image_bytes, mime_type, label_data)
                flywheel_logged = True
            return {"success": True, "teacher_decision": label_data, "simulated": False, "flywheel_logged": flywheel_logged}
        except Exception as e:
            return {"success": False, "error": f"API request error: {str(e)}", "simulated": False}
