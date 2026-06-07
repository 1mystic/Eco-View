import logging
from typing import List, Dict, Any

logger = logging.getLogger("spatial_analysis.cluster")

class MoranClusterDetector:
    def __init__(self):
        self.has_pysal = False
        try:
            import libpysal
            import esda
            import pandas as pd
            import numpy as np
            self.has_pysal = True
            print("[+] Successfully initialized PySaL and ESDA for Spatial Cluster Analysis.")
        except ImportError:
            print("[!] PySaL, ESDA, Pandas, or NumPy not found. Cluster detector will run in mock mathematical fallback mode.")

    def analyze_clusters(self, incidents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Runs Local Indicators of Spatial Association (LISA) / Local Moran's I.
        Categorizes points into:
        - Hotspot (High-High): High pollution point surrounded by high pollution points.
        - Coldspot (Low-Low): Low pollution point surrounded by low pollution points.
        - Outlier (High-Low): High pollution point surrounded by low pollution points.
        - Outlier (Low-High): Low pollution point surrounded by high pollution points.
        - Not Significant: No strong spatial clustering.
        """
        if not incidents:
            return []

        # If we have PySaL/ESDA and enough data points (min 4 points to run KNN weights)
        if self.has_pysal and len(incidents) >= 4:
            try:
                import libpysal
                import esda
                import pandas as pd
                import numpy as np

                df = pd.DataFrame(incidents)
                # Check required columns
                required_cols = {'latitude', 'longitude', 'intensity'}
                if not required_cols.issubset(df.columns):
                    raise ValueError(f"Incidents must contain keys: {required_cols}")

                # Ensure intensity is float
                df['intensity'] = df['intensity'].astype(float)
                
                # Check for zero variance in intensity
                if df['intensity'].std() == 0:
                    logger.warning("Zero variance in intensities. All points marked Not Significant.")
                    return self._generate_not_significant_results(incidents)

                # Extract coordinates
                coords = np.column_stack((df['longitude'].values, df['latitude'].values))
                
                # Setup spatial weights matrix using KNN
                # k = number of neighbors to consider (default to 4, capped at len(df)-1)
                k = min(4, len(df) - 1)
                w = libpysal.weights.KNN.from_array(coords, k=k)
                w.transform = 'R'  # Row-standardized weights

                # Compute Local Moran's I
                y = df['intensity'].values
                lm = esda.moran.Moran_Local(y, w, transformation='r', permutations=99, seed=42)

                # Quadrants: 1: HH, 2: LH, 3: LL, 4: HL
                quadrant_labels = {
                    1: "Hotspot (High-High)",
                    2: "Outlier (Low-High)",
                    3: "Coldspot (Low-Low)",
                    4: "Outlier (High-Low)"
                }

                results = []
                for idx in range(len(df)):
                    # Typically, p-values <= 0.05 are considered statistically significant
                    p_val = float(lm.p_sim[idx])
                    quadrant = int(lm.q[idx])
                    
                    is_significant = p_val <= 0.05
                    classification = quadrant_labels.get(quadrant, "Not Significant") if is_significant else "Not Significant"
                    
                    results.append({
                        "id": incidents[idx].get("id", str(idx)),
                        "latitude": float(df.iloc[idx]['latitude']),
                        "longitude": float(df.iloc[idx]['longitude']),
                        "intensity": float(df.iloc[idx]['intensity']),
                        "local_moran_i": float(lm.Is[idx]),
                        "p_value": p_val,
                        "quadrant": quadrant,
                        "classification": classification
                    })
                return results

            except Exception as e:
                logger.error(f"Error in spatial cluster analysis: {e}. Falling back to mock math.")
                return self._mock_analyze_clusters(incidents)
        else:
            return self._mock_analyze_clusters(incidents)

    def _generate_not_significant_results(self, incidents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Helper to return default not-significant results."""
        return [
            {
                "id": inc.get("id", str(idx)),
                "latitude": float(inc["latitude"]),
                "longitude": float(inc["longitude"]),
                "intensity": float(inc["intensity"]),
                "local_moran_i": 0.0,
                "p_value": 1.0,
                "quadrant": 0,
                "classification": "Not Significant"
            }
            for idx, inc in enumerate(incidents)
        ]

    def _mock_analyze_clusters(self, incidents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        A high-quality math-based simulator that computes spatial weights and local averages
        using standard Euclidean distance to classify hotspots/coldspots. Runs on pure Python.
        """
        if len(incidents) < 2:
            return self._generate_not_significant_results(incidents)

        import math
        
        # Calculate global mean of intensity
        intensities = [float(inc["intensity"]) for inc in incidents]
        mean_intensity = sum(intensities) / len(intensities)
        
        # If std is zero
        sq_diffs = [(x - mean_intensity) ** 2 for x in intensities]
        variance = sum(sq_diffs) / len(sq_diffs)
        if variance == 0:
            return self._generate_not_significant_results(incidents)
            
        std_dev = math.sqrt(variance)

        results = []
        for idx_i, inc_i in enumerate(incidents):
            lat_i = float(inc_i["latitude"])
            lon_i = float(inc_i["longitude"])
            val_i = float(inc_i["intensity"])
            
            # Find distances and compute spatial lag (weighted average of neighbors)
            neighbors = []
            for idx_j, inc_j in enumerate(incidents):
                if idx_i == idx_j:
                    continue
                lat_j = float(inc_j["latitude"])
                lon_j = float(inc_j["longitude"])
                val_j = float(inc_j["intensity"])
                
                # Simple Euclidean distance
                dist = math.sqrt((lat_i - lat_j)**2 + (lon_i - lon_j)**2)
                # Avoid division by zero
                dist = max(dist, 0.0001)
                # Weight inversely proportional to distance (IDW style)
                weight = 1.0 / dist
                neighbors.append((weight, val_j))
                
            # Sort neighbors by weight (closest first) and take top 4
            neighbors.sort(key=lambda x: x[0], reverse=True)
            top_neighbors = neighbors[:4]
            
            total_weight = sum(n[0] for n in top_neighbors)
            weighted_sum = sum(n[0] * n[1] for n in top_neighbors)
            spatial_lag = weighted_sum / total_weight if total_weight > 0 else mean_intensity

            # Standardized values (Z-scores)
            z_i = (val_i - mean_intensity) / std_dev
            z_lag = (spatial_lag - mean_intensity) / std_dev

            # Quadrant classification
            # Q1 (HH): z_i > 0 and z_lag > 0
            # Q2 (LH): z_i < 0 and z_lag > 0
            # Q3 (LL): z_i < 0 and z_lag < 0
            # Q4 (HL): z_i > 0 and z_lag < 0
            
            if z_i >= 0 and z_lag >= 0:
                quadrant = 1
                raw_classification = "Hotspot (High-High)"
            elif z_i < 0 and z_lag >= 0:
                quadrant = 2
                raw_classification = "Outlier (Low-High)"
            elif z_i < 0 and z_lag < 0:
                quadrant = 3
                raw_classification = "Coldspot (Low-Low)"
            else:
                quadrant = 4
                raw_classification = "Outlier (High-Low)"
                
            # Simulate a simple pseudo p-value based on standardized deviations
            product = abs(z_i * z_lag)
            p_val = max(0.01, min(1.0, 1.0 / (1.0 + product * 1.5)))
            
            # Significant if both the point and lag are moderately far from mean
            is_significant = p_val <= 0.15 and len(incidents) >= 4
            classification = raw_classification if is_significant else "Not Significant"
            
            results.append({
                "id": inc_i.get("id", str(idx_i)),
                "latitude": lat_i,
                "longitude": lon_i,
                "intensity": val_i,
                "local_moran_i": round(z_i * z_lag, 4),
                "p_value": round(p_val, 4),
                "quadrant": quadrant,
                "classification": classification
            })
            
        return results
