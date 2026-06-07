import os
import json
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("spatial_analysis.interpolation")

# Helper to map intensity value (0 to 10) to a Hex Color for Leaflet rendering
def get_color_for_intensity(val: float) -> str:
    # Blend from green (low risk) to yellow (medium) to red (high) to purple (critical)
    if val < 2.0:
        return "#2ecc71" # Green
    elif val < 4.0:
        return "#f1c40f" # Yellow
    elif val < 7.0:
        return "#e67e22" # Orange
    elif val < 9.0:
        return "#e74c3c" # Red
    else:
        return "#9b59b6" # Purple

class SpatialRiskInterpolator:
    def __init__(self):
        self.has_scipy = False
        self.has_shapely = False
        try:
            from scipy.interpolate import Rbf
            import numpy as np
            self.has_scipy = True
        except ImportError:
            pass
            
        try:
            from shapely.geometry import Point, shape, LineString, Polygon
            self.has_shapely = True
            print("[+] Successfully initialized Shapely for Proximity Risk Queries.")
        except ImportError:
            print("[!] Shapely not found. Proximity risk calculation will use mathematical spherical approximation.")

    def interpolate_idw_grid(self, incidents: List[Dict[str, Any]], grid_resolution: int = 25) -> Dict[str, Any]:
        """
        Takes pollution incident reports, interpolates intensity across a bounding box grid,
        and returns a Leaflet-friendly GeoJSON FeatureCollection of cell squares.
        """
        if not incidents:
            return {"type": "FeatureCollection", "features": []}

        lats = [float(inc["latitude"]) for inc in incidents]
        lons = [float(inc["longitude"]) for inc in incidents]
        vals = [float(inc["intensity"]) for inc in incidents]

        # Calculate bounding box with small buffer margin
        lat_min, lat_max = min(lats) - 0.02, max(lats) + 0.02
        lon_min, lon_max = min(lons) - 0.02, max(lons) + 0.02

        # Handle single point or zero range
        if lat_min == lat_max or lon_min == lon_max:
            lat_min, lat_max = lat_min - 0.02, lat_max + 0.02
            lon_min, lon_max = lon_min - 0.02, lon_max + 0.02

        # Step 1: Interpolate grid values
        import numpy as np
        grid_lat = np.linspace(lat_min, lat_max, grid_resolution)
        grid_lon = np.linspace(lon_min, lon_max, grid_resolution)
        grid_lon_mesh, grid_lat_mesh = np.meshgrid(grid_lon, grid_lat)
        
        if self.has_scipy:
            try:
                from scipy.interpolate import Rbf
                # Radial Basis Function interpolation (multiquadric kernel)
                # epsilon handles smoothing to prevent singularity spikes
                rbf = Rbf(lons, lats, vals, function='linear', epsilon=0.01)
                grid_vals = rbf(grid_lon_mesh, grid_lat_mesh)
            except Exception as e:
                logger.error(f"Scipy RBF interpolation failed: {e}. Falling back to manual IDW.")
                grid_vals = self._manual_idw(lons, lats, vals, grid_lon_mesh, grid_lat_mesh)
        else:
            grid_vals = self._manual_idw(lons, lats, vals, grid_lon_mesh, grid_lat_mesh)

        # Clip values to range [0, 10]
        grid_vals = np.clip(grid_vals, 0.0, 10.0)

        # Step 2: Convert grid to GeoJSON Feature Collection
        features = []

        for i in range(grid_resolution - 1):
            for j in range(grid_resolution - 1):
                # Calculate cell average value
                c_val = (grid_vals[i, j] + grid_vals[i+1, j] + grid_vals[i+1, j+1] + grid_vals[i, j+1]) / 4.0
                
                # Exclude ultra-low values to keep geojson light
                if c_val < 0.2:
                    continue

                # Cell corner coordinates
                c_lons = [grid_lon[j], grid_lon[j+1], grid_lon[j+1], grid_lon[j], grid_lon[j]]
                c_lats = [grid_lat[i], grid_lat[i], grid_lat[i+1], grid_lat[i+1], grid_lat[i]]
                
                polygon_coords = [[ [lon, lat] for lon, lat in zip(c_lons, c_lats) ]]
                
                features.append({
                    "type": "Feature",
                    "properties": {
                        "intensity": round(float(c_val), 2),
                        "color": get_color_for_intensity(c_val),
                        "fillOpacity": min(0.7, 0.1 + (c_val / 15.0))
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": polygon_coords
                    }
                })

        return {
            "type": "FeatureCollection",
            "features": features
        }

    def _manual_idw(self, lons, lats, vals, grid_lon, grid_lat):  # returns np.ndarray
        """Manual Inverse Distance Weighting interpolation implementation in NumPy."""
        import numpy as np
        grid_shape = grid_lon.shape
        grid_vals = np.zeros(grid_shape)
        
        for i in range(grid_shape[0]):
            for j in range(grid_shape[1]):
                glat = grid_lat[i, j]
                glon = grid_lon[i, j]
                
                # Compute distance to all points
                dists = np.sqrt((np.array(lons) - glon)**2 + (np.array(lats) - glat)**2)
                
                # If exact match
                if np.any(dists < 0.0001):
                    grid_vals[i, j] = vals[np.argmin(dists)]
                    continue
                    
                # Weights are 1 / d^2
                weights = 1.0 / (dists ** 2)
                grid_vals[i, j] = np.sum(weights * np.array(vals)) / np.sum(weights)
                
        return grid_vals

    def compute_proximity_alerts(self, latitude: float, longitude: float, ecosystems_geojson: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Uses Shapely to compute exact distance from an incident point to critical ecosystems
        defined in a GeoJSON dataset. Falls back to mock coordinate math if Shapely isn't installed.
        """
        alerts = []
        point_lon, point_lat = longitude, latitude

        # Default critical ecosystems for Indian region if no file is provided
        default_ecosystems = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"name": "Bhopal Upper Lake", "type": "Water Reservoir"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [77.30, 23.23], [77.37, 23.23], [77.37, 23.28], [77.30, 23.28], [77.30, 23.23]
                        ]]
                    }
                },
                {
                    "type": "Feature",
                    "properties": {"name": "Narmada River Tributary", "type": "River"},
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [[77.20, 23.10], [77.40, 23.15], [77.60, 23.12]]
                    }
                },
                {
                    "type": "Feature",
                    "properties": {"name": "Van Vihar National Park Buffer", "type": "Protected Forest"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [77.34, 23.20], [77.38, 23.20], [77.38, 23.24], [77.34, 23.24], [77.34, 23.20]
                        ]]
                    }
                }
            ]
        }

        # Load GeoJSON from file if provided and exists
        ecosystems = default_ecosystems
        if ecosystems_geojson and os.path.exists(ecosystems_geojson):
            try:
                with open(ecosystems_geojson, 'r') as f:
                    ecosystems = json.load(f)
            except Exception as e:
                logger.error(f"Failed to read ecosystems geojson from {ecosystems_geojson}: {e}")

        if self.has_shapely:
            try:
                from shapely.geometry import Point, shape
                point = Point(point_lon, point_lat)
                
                for feature in ecosystems.get("features", []):
                    geom = shape(feature["geometry"])
                    properties = feature.get("properties", {})
                    name = properties.get("name", "Unnamed Ecosystem")
                    eco_type = properties.get("type", "Ecosystem")
                    
                    # Calculate distance (degrees to meters approximation: 1 degree approx 111,320m)
                    dist_deg = point.distance(geom)
                    dist_meters = dist_deg * 111320.0
                    
                    # Log alerts for ecosystems within 1.5 km (1500 meters)
                    if dist_meters <= 1500.0:
                        risk_status = "CRITICAL" if dist_meters <= 400.0 else "WARNING"
                        alerts.append({
                            "ecosystem_name": name,
                            "ecosystem_type": eco_type,
                            "distance_meters": round(dist_meters, 1),
                            "risk_status": risk_status,
                            "description": f"Incident is {round(dist_meters)}m away from {name}."
                        })
                return alerts
            except Exception as e:
                logger.error(f"Shapely distance calculation failed: {e}. Falling back to coordinate math.")
                return self._mock_proximity_alerts(point_lat, point_lon, ecosystems)
        else:
            return self._mock_proximity_alerts(point_lat, point_lon, ecosystems)

    def _mock_proximity_alerts(self, lat: float, lon: float, ecosystems: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Mock proximity calculator in pure python using Haversine formula approximation."""
        import math
        alerts = []
        
        def get_dist_point_to_point(lat1, lon1, lat2, lon2):
            # Haversine distance
            R = 6371000 # Earth radius in meters
            phi1 = math.radians(lat1)
            phi2 = math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dlambda = math.radians(lon2 - lon1)
            a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
            return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))

        for feature in ecosystems.get("features", []):
            geom = feature["geometry"]
            properties = feature.get("properties", {})
            name = properties.get("name", "Unnamed Ecosystem")
            eco_type = properties.get("type", "Ecosystem")
            
            # Simple approximation by taking the average centroid coordinate of geometry
            coords = []
            if geom["type"] == "Point":
                coords = [geom["coordinates"]]
            elif geom["type"] == "LineString":
                coords = geom["coordinates"]
            elif geom["type"] == "Polygon":
                coords = geom["coordinates"][0] # Exterior ring
                
            if not coords:
                continue
                
            # Average coordinates
            mean_lon = sum(c[0] for c in coords) / len(coords)
            mean_lat = sum(c[1] for c in coords) / len(coords)
            
            dist_meters = get_dist_point_to_point(lat, lon, mean_lat, mean_lon)
            
            if dist_meters <= 1500.0:
                risk_status = "CRITICAL" if dist_meters <= 400.0 else "WARNING"
                alerts.append({
                    "ecosystem_name": name,
                    "ecosystem_type": eco_type,
                    "distance_meters": round(dist_meters, 1),
                    "risk_status": risk_status,
                    "description": f"Incident is approx {round(dist_meters)}m away from {name} center."
                })
                
        return alerts
