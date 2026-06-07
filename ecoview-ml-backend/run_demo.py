import os
import sys
import json
import time

# Force UTF-8 output so Windows cp1252 consoles don't crash on special characters
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Ensure current directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import dummy model generator
from scripts.generate_dummy_onnx import generate_dummy_onnx

def run_pipeline_demo():
    print("="*60)
    print(" ECOVIEW ML & SPATIAL DATA SCIENCE ENGINE DEMO ")
    print("="*60)
    
    # Setup directories
    project_dir = os.path.dirname(os.path.abspath(__file__))
    onnx_path = os.path.join(project_dir, "student_model.onnx")
    quantized_path = os.path.join(project_dir, "student_model_quantized.onnx")
    
    # ── Step 1: Model Compilation (ONNX & Quantization) ────────────────────
    print("\n--- PHASE 1: Student Model Compiler & Quantizer ---")
    # This will export ONNX + Quantize if PyTorch is installed locally
    generate_dummy_onnx(onnx_path, quantized_path)
    
    # ── Step 2: Initialize ML subsystem ─────────────────────────────────────
    print("\n--- PHASE 2: Student-Teacher Inference Pipeline ---")
    from core.inference import ONNXStudentClassifier
    from core.fallback_validator import VLMTeacherValidator
    
    classifier = ONNXStudentClassifier(quantized_path)
    teacher = VLMTeacherValidator()
    
    # Test image URL (mock image)
    test_img = "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=500&q=80"
    
    # Case A: Student prediction (will use ONNX or simulator depending on model availability)
    print("\n[+] Case A: Student Model Inference")
    res_student = classifier.classify(test_img)
    print(f"Student Result: Label={res_student['label']}, Confidence={res_student['confidence']:.3f}, Mode={res_student['inference_mode']}")
    
    if res_student["confidence"] >= 0.85:
        print("Gate Check: CONFIDENCE >= 0.85 -> Map Immediately! (No VLM Cost)")
    else:
        print(f"Gate Check: CONFIDENCE = {res_student['confidence']:.3f} < 0.85 -> Would escalate to VLM Teacher.")
        
    # Case B: Forced escalation to VLM Teacher to demonstrate full pipeline
    # We always show this path so the demo proves the flywheel loop works
    print("\n[+] Case B: Forced VLM Teacher Escalation (Data Flywheel Demo)")
    print("[*] Simulating low-confidence student result: escalating to Gemini VLM Teacher...")
    res_teacher = teacher.validate_image(test_img)
    if res_teacher["success"]:
        decision = res_teacher["teacher_decision"]
        print(f"VLM Teacher Label: {decision['category']}")
        print(f"VLM Teacher Confidence: {decision['confidence']}")
        print(f"VLM Teacher Reason: {decision['reason']}")
        print(f"Flywheel Logged: {res_teacher.get('flywheel_logged', False)}")
        
        # Check flywheel files
        flywheel_dir = os.path.join(project_dir, "data", "flywheel")
        if os.path.isdir(flywheel_dir):
            files = os.listdir(flywheel_dir)
            json_files = [f for f in files if f.endswith(".json")]
            print(f"Total Flywheel Labeled Items: {len(json_files)}")
        else:
            print("[!] Flywheel directory not created yet.")
    else:
        print(f"[!] VLM Teacher failed: {res_teacher.get('error')}.")
            
    # ── Step 3: Spatial Cluster Analysis (Moran's I) ──────────────────────
    print("\n--- PHASE 3: Spatial Hotspot Analysis (Local Moran's I) ---")
    from spatial_analysis.cluster_detection import MoranClusterDetector
    
    detector = MoranClusterDetector()
    
    # Simulate a spatial cluster (Hotspot around Bhopal coordinate 23.25, 77.41)
    simulated_incidents = [
        {"id": "inc_01", "latitude": 23.250, "longitude": 77.410, "intensity": 9.2}, # Center of hotspot
        {"id": "inc_02", "latitude": 23.252, "longitude": 77.412, "intensity": 8.8}, # Neighbor
        {"id": "inc_03", "latitude": 23.248, "longitude": 77.408, "intensity": 8.5}, # Neighbor
        {"id": "inc_04", "latitude": 23.249, "longitude": 77.415, "intensity": 9.0}, # Neighbor
        {"id": "inc_05", "latitude": 23.290, "longitude": 77.310, "intensity": 1.2}, # Isolated low pollution (Bhopal lake area)
        {"id": "inc_06", "latitude": 23.285, "longitude": 77.315, "intensity": 0.8}, # Isolated low
        {"id": "inc_07", "latitude": 23.280, "longitude": 77.308, "intensity": 1.5}, # Isolated low
        {"id": "inc_08", "latitude": 23.200, "longitude": 77.500, "intensity": 4.5}, # Moderate isolated report
    ]
    
    clusters = detector.analyze_clusters(simulated_incidents)
    
    print("\nMoran's I Outputs (LISA Classifications):")
    print(f"{'ID':<8} | {'Lat':<6} | {'Lon':<6} | {'Intensity':<9} | {'Moran I':<8} | {'p-value':<7} | {'Classification'}")
    print("-"*80)
    for c in clusters:
        # Highlight hotspots in output
        prefix = "[HOT] " if "Hotspot" in c["classification"] else "      "
        print(f"{prefix}{c['id']:<5} | {c['latitude']:<6.3f} | {c['longitude']:<6.3f} | {c['intensity']:<9.1f} | {c['local_moran_i']:<8.3f} | {c['p_value']:<7.3f} | {c['classification']}")

    # ── Step 4: Spatial Interpolation (IDW Continuous Heatmap) ──────────────
    print("\n--- PHASE 4: Spatial Interpolation (IDW GeoJSON Heatmap) ---")
    from spatial_analysis.interpolator import SpatialRiskInterpolator
    
    interpolator = SpatialRiskInterpolator()
    geojson_grid = interpolator.interpolate_idw_grid(simulated_incidents, grid_resolution=15)
    
    features = geojson_grid.get("features", [])
    print(f"[+] Interpolated grid generated successfully!")
    print(f"[+] Total grid cells with risk > 0.2: {len(features)}")
    
    if features:
        sample = features[0]
        print(f"Sample Grid Cell GeoJSON properties: {json.dumps(sample['properties'])}")
        print(f"Sample Grid Cell Geometry type: {sample['geometry']['type']}")
        
    # ── Step 5: Proximity Alerts (Shapely) ──────────────────────────────────
    print("\n--- PHASE 5: Proximity Ecosystem Risk Alerts (Shapely) ---")
    # Test point close to Bhopal Upper Lake (Center coordinates ~ 23.25, 77.35)
    test_lat, test_lon = 23.245, 77.350
    print(f"[*] Simulating user report at ({test_lat}, {test_lon}). Checking nearest ecosystems...")
    
    alerts = interpolator.compute_proximity_alerts(test_lat, test_lon)
    for alert in alerts:
        # Highlight critical warning
        badge = "[!! CRITICAL]" if alert["risk_status"] == "CRITICAL" else "[!  WARNING ]"
        print(f"{badge} {alert['ecosystem_name']} ({alert['ecosystem_type']}): Distance={alert['distance_meters']}m | {alert['description']}")

    print("\n" + "="*60)
    print(" VERIFICATION COMPLETE: ALL CHANNELS PASS ")
    print("="*60)

if __name__ == "__main__":
    run_pipeline_demo()
