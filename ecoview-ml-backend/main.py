import os
import time
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from core.inference import ONNXStudentClassifier, SEVERITY_MAP
from core.fallback_validator import VLMTeacherValidator

try:
    from spatial_analysis.cluster_detection import MoranClusterDetector
    from spatial_analysis.interpolator import SpatialRiskInterpolator
    _spatial_available = True
except Exception:
    _spatial_available = False
    MoranClusterDetector = None
    SpatialRiskInterpolator = None

app = FastAPI(
    title="EcoView ML & Spatial Analytics API",
    version="1.0.0",
    description="Optimized Machine Learning and Geospatial Data Science Engine for EcoView."
)

# Configure CORS
allowed_origins_raw = os.environ.get(
    "ALLOWED_ORIGINS", 
    "http://localhost:5173,http://localhost:3000,http://localhost:4173,http://127.0.0.1:5173,https://ecoview.vercel.app"
)
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize subsystems
student_classifier = ONNXStudentClassifier()
teacher_validator = VLMTeacherValidator()
cluster_detector = MoranClusterDetector() if _spatial_available else None
spatial_interpolator = SpatialRiskInterpolator() if _spatial_available else None

# ── Pydantic Request/Response Models ─────────────────────────────────────────

class ClassifyRequest(BaseModel):
    image_url: Optional[str] = Field(None, description="HTTP URL to the image")
    image_base64: Optional[str] = Field(None, description="Base64 data URL (data:image/jpeg;base64,...) or raw base64 string")
    text_description: Optional[str] = Field(None, description="Text description of the incident when no image is available")

class ClassifyResponse(BaseModel):
    label: str
    confidence: float
    severity: str
    processing_time_ms: int
    model_version: str
    inference_mode: str
    escalated_to_vlm: bool
    vlm_reason: Optional[str] = None
    flywheel_logged: bool = False

class IncidentItem(BaseModel):
    id: str = Field(..., description="Unique ID of the incident")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    intensity: float = Field(..., ge=0, le=10, description="Severity/intensity score from 0 to 10")

class ClusterResponseItem(BaseModel):
    id: str
    latitude: float
    longitude: float
    intensity: float
    local_moran_i: float
    p_value: float
    quadrant: int
    classification: str

class HeatmapRequest(BaseModel):
    incidents: List[IncidentItem]
    grid_resolution: Optional[int] = Field(25, ge=10, le=100)

class ProximityRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ecosystems_geojson_path: Optional[str] = Field(None, description="Path to custom ecosystem GeoJSON file")

class ProximityAlertItem(BaseModel):
    ecosystem_name: str
    ecosystem_type: str
    distance_meters: float
    risk_status: str
    description: str

# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "EcoView ML API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "classify": "POST /inference/classify",
            "docs": "/docs",
        },
    }

@app.get("/health")
async def health():
    """Health check endpoint showing subsystem configurations."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "components": {
            "student_classifier": {
                "mode": "simulator" if student_classifier.is_simulator else "onnx",
                "model_path": student_classifier.model_path
            },
            "teacher_validator": {
                "has_api_key": teacher_validator.api_key is not None
            },
            "spatial_cluster_detector": {
                "available": _spatial_available,
                "has_pysal_libraries": cluster_detector.has_pysal if cluster_detector else False,
            },
            "spatial_interpolator": {
                "available": _spatial_available,
                "has_scipy": spatial_interpolator.has_scipy if spatial_interpolator else False,
                "has_shapely": spatial_interpolator.has_shapely if spatial_interpolator else False,
            }
        }
    }

@app.post("/inference/classify", response_model=ClassifyResponse)
def classify_image_endpoint(body: ClassifyRequest):
    """
    Automated Data Flywheel Inference Gate:
    1. Run fast evaluation using local student model (ONNX).
    2. If confidence >= 0.85, return prediction directly.
    3. If confidence < 0.85 (low confidence / ambiguous), run deep-thinking VLM validation (Gemini).
    4. If VLM confirms, the image is logged to local training directory for asynchronous model distillation.
    """
    if not body.image_url and not body.image_base64 and not body.text_description:
        raise HTTPException(status_code=422, detail="Provide image_url, image_base64, or text_description")

    image_source = body.image_url or body.image_base64
    start_time = time.perf_counter()

    # Text-only path: no image available, classify by description directly via VLM
    if not image_source and body.text_description:
        vlm_res = teacher_validator.validate_text(body.text_description)
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        if not vlm_res.get("success"):
            raise HTTPException(status_code=503, detail=f"Text classification failed: {vlm_res.get('error')}")
        decision = vlm_res["teacher_decision"]
        return ClassifyResponse(
            label=decision["category"],
            confidence=decision["confidence"],
            severity=SEVERITY_MAP.get(decision["category"], "medium"),
            processing_time_ms=elapsed_ms,
            model_version="gemini-3.1-flash-lite-text" if not vlm_res.get("simulated") else "gemini-3.1-flash-lite-text-sim",
            inference_mode="vlm_text_only",
            escalated_to_vlm=True,
            vlm_reason=decision["reason"],
            flywheel_logged=False,
        )

    # 1. Run local student inference
    student_res = student_classifier.classify(image_source)
    
    # Check threshold gate
    if student_res["confidence"] >= 0.85:
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        return ClassifyResponse(
            label=student_res["label"],
            confidence=student_res["confidence"],
            severity=student_res["severity"],
            processing_time_ms=elapsed_ms,
            model_version=student_res["model_version"],
            inference_mode=student_res["inference_mode"],
            escalated_to_vlm=False,
            flywheel_logged=False
        )
    
    # 2. Fall back to VLM Teacher
    print(f"[*] Confidence ({student_res['confidence']}) below 85% threshold. Escalating to VLM Teacher...")
    vlm_res = teacher_validator.validate_image(image_source)
    
    if not vlm_res.get("success"):
        # If teacher fails, return student predictions as default backup
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        return ClassifyResponse(
            label=student_res["label"],
            confidence=student_res["confidence"],
            severity=student_res["severity"],
            processing_time_ms=elapsed_ms,
            model_version=student_res["model_version"],
            inference_mode=student_res["inference_mode"],
            escalated_to_vlm=True,
            vlm_reason=f"VLM escalation failed: {vlm_res.get('error')}. Using student prediction as fallback.",
            flywheel_logged=False
        )
        
    decision = vlm_res["teacher_decision"]
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    
    return ClassifyResponse(
        label=decision["category"],
        confidence=decision["confidence"],
        severity=SEVERITY_MAP.get(decision["category"], "medium"),
        processing_time_ms=elapsed_ms,
        model_version="gemini-3.1-flash-lite-vlm" if not vlm_res.get("simulated") else "gemini-3.1-flash-lite-simulator",
        inference_mode="vlm_teacher",
        escalated_to_vlm=True,
        vlm_reason=decision["reason"],
        flywheel_logged=vlm_res.get("flywheel_logged", False)
    )

@app.post("/spatial/analyze-clusters", response_model=List[ClusterResponseItem])
def analyze_clusters_endpoint(incidents: List[IncidentItem]):
    if not _spatial_available or not cluster_detector:
        raise HTTPException(status_code=503, detail="Spatial analysis dependencies not installed.")
    if not incidents:
        raise HTTPException(status_code=400, detail="Incident list cannot be empty.")
    inc_dicts = [item.model_dump() for item in incidents]
    results = cluster_detector.analyze_clusters(inc_dicts)
    return [ClusterResponseItem(**res) for res in results]

@app.post("/spatial/risk-heatmap")
def generate_heatmap_endpoint(body: HeatmapRequest):
    if not _spatial_available or not spatial_interpolator:
        raise HTTPException(status_code=503, detail="Spatial analysis dependencies not installed.")
    if not body.incidents:
        raise HTTPException(status_code=400, detail="Incident list cannot be empty.")
    inc_dicts = [item.model_dump() for item in body.incidents]
    return spatial_interpolator.interpolate_idw_grid(incidents=inc_dicts, grid_resolution=body.grid_resolution)

@app.post("/spatial/proximity-alerts", response_model=List[ProximityAlertItem])
def check_proximity_endpoint(body: ProximityRequest):
    if not _spatial_available or not spatial_interpolator:
        raise HTTPException(status_code=503, detail="Spatial analysis dependencies not installed.")
    alerts = spatial_interpolator.compute_proximity_alerts(
        latitude=body.latitude, longitude=body.longitude, ecosystems_geojson=body.ecosystems_geojson_path
    )
    return [ProximityAlertItem(**alert) for alert in alerts]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=7860, reload=True)
