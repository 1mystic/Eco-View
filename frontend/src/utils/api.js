// ML & Spatial Analytics — calls HuggingFace Space (or local dev server)
// All incident/user/stats data now lives in Firebase Firestore (see firestoreIncidents.js)

const ML_BASE = import.meta.env.VITE_ML_URL || 'http://localhost:8080';

async function mlFetch(path, options = {}) {
  const res = await fetch(`${ML_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `ML API HTTP ${res.status}`);
  }
  return res.json();
}

// Classify a pollution image via the ML microservice.
// Returns: { label, confidence, severity, processing_time_ms, ... }
export const classifyImage = (imageUrl) =>
  mlFetch('/inference/classify', {
    method: 'POST',
    body: JSON.stringify({ image_url: imageUrl }),
  });

// Spatial cluster analysis (Local Moran's I) on a set of incident points.
// incidents: [{ latitude, longitude, severity_score }]
export const getClusterAnalysis = (incidents) =>
  mlFetch('/spatial/analyze-clusters', {
    method: 'POST',
    body: JSON.stringify({ incidents }),
  });

// IDW risk heatmap as GeoJSON polygon grid.
// incidents: [{ latitude, longitude, severity_score }]
export const getRiskHeatmap = (incidents) =>
  mlFetch('/spatial/risk-heatmap', {
    method: 'POST',
    body: JSON.stringify({ incidents, grid_resolution: 20 }),
  });

// Proximity alert — check how close a point is to protected ecosystems.
export const getProximityAlerts = (latitude, longitude) =>
  mlFetch('/spatial/proximity-alerts', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  });

// Health check for the ML service.
export const checkMLHealth = () => mlFetch('/health');
