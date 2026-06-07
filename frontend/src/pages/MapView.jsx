import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { getAllReports } from '../utils/services';
import 'leaflet/dist/leaflet.css';
import { biodiversityHotspotsData } from '../components/biodiversityHotspots';
import * as turf from '@turf/turf';
import { toast } from 'sonner';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import ReportDetailDialog from '../components/ReportDetailDialog';
import '../styles/ecoview.css';

const MAP_CENTER = [20.5937, 78.9629];
const INITIAL_ZOOM = 5;
const POLLUTION_THRESHOLD = 1;
const HOT_HOTSPOT_COLOR = '#A50026';
const HOT_HOTSPOT_OPACITY = 0.7;

const createCustomIcon = (color) => L.icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const pendingIcon  = createCustomIcon('yellow');
const verifiedIcon = createCustomIcon('red');
const resolvedIcon = createCustomIcon('green');
const hotspotLegendColors = ['#008000', '#FFFF00', '#FF0000', '#C71585'];

// Compute an environmental health score (0–100) for a hotspot based on reports in it.
function computeHealthScore(pendingCount, verifiedCount, resolvedCount) {
  const penalty = pendingCount * 5 + verifiedCount * 15 + resolvedCount * 3;
  return Math.max(0, Math.min(100, 100 - penalty));
}

function healthGrade(score) {
  if (score >= 85) return { grade: 'A', color: '#16a34a' };
  if (score >= 70) return { grade: 'B', color: '#65a30d' };
  if (score >= 50) return { grade: 'C', color: '#d97706' };
  if (score >= 30) return { grade: 'D', color: '#ea580c' };
  return { grade: 'F', color: '#dc2626' };
}

// Simple SVG sparkline — shows report counts for the last 6 weeks.
const Sparkline = ({ reports }) => {
  const now = Date.now();
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const start = now - (6 - i) * WEEK_MS;
    const end   = now - (5 - i) * WEEK_MS;
    return reports.filter((r) => {
      const t = r.timestamp instanceof Date ? r.timestamp.getTime() : new Date(r.created_at).getTime();
      return t >= start && t < end;
    }).length;
  });
  const max = Math.max(...weeks, 1);
  const W = 90, H = 32;
  const pts = weeks.map((v, i) => `${(i / 5) * W},${H - (v / max) * (H - 4)}`).join(' ');
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke="#16a34a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {weeks.map((v, i) => (
        <circle key={i} cx={(i / 5) * W} cy={H - (v / max) * (H - 4)} r="3" fill="#16a34a" />
      ))}
    </svg>
  );
};

const Spinner = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" strokeDasharray="80" strokeDashoffset="30" strokeLinecap="round" opacity="0.4" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const MapView = () => {
  const [reports, setReports]                   = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [processedHotspots, setProcessedHotspots] = useState([]);
  const [selectedReport, setSelectedReport]     = useState(null);

  const processHotspots = useCallback((fetchedReports) => {
    return biodiversityHotspotsData.features.map((hotspot) => {
      try {
        let hotspotPolygon;
        if (hotspot.geometry.type === 'MultiPolygon') {
          hotspotPolygon = turf.union(...hotspot.geometry.coordinates.map((c) => turf.polygon(c)));
        } else {
          hotspotPolygon = turf.polygon(hotspot.geometry.coordinates);
        }

        const inside = fetchedReports.filter((r) => {
          try {
            return turf.booleanPointInPolygon(turf.point([r.longitude, r.latitude]), hotspotPolygon);
          } catch { return false; }
        });

        const pendingCount  = inside.filter((r) => r.status === 'pending').length;
        const verifiedCount = inside.filter((r) => r.status === 'verified').length;
        const resolvedCount = inside.filter((r) => r.status === 'resolved').length;
        const score = computeHealthScore(pendingCount, verifiedCount, resolvedCount);

        return {
          ...hotspot,
          _reportsInside: inside,
          properties: {
            ...hotspot.properties,
            reportCount: inside.length,
            pendingCount,
            verifiedCount,
            resolvedCount,
            healthScore: score,
            healthGrade: healthGrade(score),
          },
        };
      } catch {
        return { ...hotspot, _reportsInside: [], properties: { ...hotspot.properties, reportCount: 0, pendingCount: 0, verifiedCount: 0, resolvedCount: 0, healthScore: 100, healthGrade: { grade: 'A', color: '#16a34a' } } };
      }
    });
  }, []);

  useEffect(() => {
    getAllReports()
      .then((fetchedReports) => {
        setReports(fetchedReports);
        setProcessedHotspots(processHotspots(fetchedReports));
        toast.success(`Map loaded — ${fetchedReports.length} reports`);
      })
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [processHotspots]);

  // After a verify action, refresh that report in local state
  const handleVerified = useCallback((reportId) => {
    setReports((prev) =>
      prev.map((r) => r.id === reportId
        ? { ...r, verification_count: (r.verification_count || 0) + 1 }
        : r
      )
    );
    setSelectedReport(null);
  }, []);

  // Export all visible reports as GeoJSON
  const exportGeoJSON = () => {
    const geoJSON = {
      type: 'FeatureCollection',
      features: reports.map((r) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
        properties: {
          id: r.id,
          type: r.type,
          description: r.description,
          status: r.status,
          ml_label: r.ml_label,
          ml_severity: r.ml_severity,
          reporter_name: r.reporter_name,
          created_at: r.created_at,
        },
      })),
    };
    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ecoview-reports-${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const getHotspotColor = (feature) => {
    if (feature.properties.reportCount > POLLUTION_THRESHOLD) return HOT_HOTSPOT_COLOR;
    switch (feature.properties.name) {
      case 'The Himalayas':                          return '#008000';
      case 'Western Ghats':                          return '#FFFF00';
      case 'Indo-Burma Region (Indian Part)':        return '#FF0000';
      case 'Sundaland (Andaman & Nicobar Islands)':  return '#C71585';
      default: return '#90EE90';
    }
  };

  const hotspotStyle = (feature) => ({
    fillColor: getHotspotColor(feature),
    weight: 2, opacity: 1, color: 'red', dashArray: '3',
    fillOpacity: feature.properties.reportCount > POLLUTION_THRESHOLD ? HOT_HOTSPOT_OPACITY : 0.5,
  });

  const onEachHotspotFeature = (feature, layer) => {
    if (!feature.properties?.name) return;
    const p = feature.properties;
    const g = p.healthGrade || { grade: 'A', color: '#16a34a' };
    layer.bindPopup(`
      <div style="min-width:200px">
        <h4 style="font-weight:700;margin-bottom:6px">${p.name}</h4>
        <p style="font-size:12px;margin-bottom:8px;color:#555">${p.description || ''}</p>
        <div style="display:flex;gap:16px;font-size:13px">
          <div>
            <div style="font-weight:700;font-size:22px;color:${g.color}">${g.grade}</div>
            <div style="font-size:11px;color:#888">Health Score</div>
          </div>
          <div>
            <div style="font-weight:700;font-size:18px">${p.healthScore}</div>
            <div style="font-size:11px;color:#888">/ 100</div>
          </div>
        </div>
        <hr style="margin:8px 0">
        <p style="font-size:12px">Total: <strong>${p.reportCount}</strong> · Pending: ${p.pendingCount} · Resolved: ${p.resolvedCount}</p>
      </div>
    `);
    layer.bindTooltip(`${p.name} — Grade ${g.grade} (${p.reportCount} reports)`, { permanent: false, direction: 'auto' });
  };

  if (loading) {
    return (
      <div className="map-page">
        <NavBar />
        <main className="map-page__main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-tertiary)' }}>
            <Spinner />
            <span style={{ fontSize: '14px' }}>Loading map data…</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-page">
        <NavBar />
        <main className="map-page__main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="map-page">
      <NavBar />

      {selectedReport && (
        <ReportDetailDialog
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onVerified={handleVerified}
        />
      )}

      <main className="map-page__main">
        <div className="container">
          <div className="app-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Pollution Map
              </h1>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
                {reports.length} live pollution incidents and biodiversity hotspots across India.
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={exportGeoJSON}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              ↓ Export GeoJSON
            </button>
          </div>

          {/* Leaflet Map */}
          <div className="map-container-card">
            <MapContainer center={MAP_CENTER} zoom={INITIAL_ZOOM} style={{ height: '65vh', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {reports.map((report) => {
                const icon = report.status === 'resolved' ? resolvedIcon
                           : (report.status === 'verified' || report.status === 'classified') ? verifiedIcon
                           : pendingIcon;
                return (
                  <Marker key={report.id} position={[report.latitude, report.longitude]} icon={icon}>
                    <Popup>
                      <div style={{ minWidth: '180px' }}>
                        <h4 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '14px' }}>{report.type}</h4>
                        <p style={{ fontSize: '12px', color: '#555', marginBottom: '6px', lineHeight: 1.5 }}>
                          {report.description.slice(0, 100)}{report.description.length > 100 ? '…' : ''}
                        </p>
                        <p style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)} · {report.verification_count} verifications
                        </p>
                        {report.ml_label && (
                          <p style={{ fontSize: '11px', color: '#16a34a', marginBottom: '8px', fontWeight: 500 }}>
                            AI: {report.ml_label.replace(/_/g, ' ')} ({Math.round((report.ml_confidence || 0) * 100)}%)
                          </p>
                        )}
                        <button
                          style={{ fontSize: '12px', background: 'var(--green-500, #16a34a)', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', width: '100%' }}
                          onClick={() => setSelectedReport(report)}
                        >
                          View Details &amp; Verify
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {processedHotspots.length > 0 && (
                <GeoJSON
                  key={processedHotspots.length}
                  data={{ type: 'FeatureCollection', features: processedHotspots }}
                  style={hotspotStyle}
                  onEachFeature={onEachHotspotFeature}
                />
              )}
            </MapContainer>
          </div>

          {/* Marker legend */}
          <div className="map-legend">
            {[
              { color: '#e6c300', label: 'Pending' },
              { color: '#dc2626', label: 'Classified / Verified' },
              { color: '#16a34a', label: 'Resolved' },
            ].map(({ color, label }) => (
              <div className="map-legend__item" key={label}>
                <span className="map-legend__dot" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>

          {/* Biodiversity Hotspots */}
          <div style={{ marginTop: '40px' }}>
            <p className="map-section-title">Biodiversity Hotspots — Environmental Health</p>
            <p className="map-section-note">
              Health score = 100 − (pollution penalty). <span style={{ color: HOT_HOTSPOT_COLOR, fontWeight: 600 }}>Dark red</span> regions exceed the pollution threshold.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginTop: '16px' }}>
              {processedHotspots.map((feature, idx) => {
                const p = feature.properties;
                const g = p.healthGrade || { grade: 'A', color: '#16a34a' };
                return (
                  <div className="hotspot-card" key={p.name}>
                    <div className="hotspot-card__name">
                      <span className="hotspot-dot" style={{ background: hotspotLegendColors[idx % hotspotLegendColors.length] }} />
                      {p.name}
                    </div>
                    <p className="hotspot-card__desc">{p.description}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <div className="hotspot-card__count">
                        {p.reportCount} report{p.reportCount !== 1 ? 's' : ''}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        Score: {p.healthScore}
                      </span>
                    </div>

                    {/* Sparkline of weekly report counts */}
                    {p.reportCount > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Last 6 weeks</p>
                        <Sparkline reports={feature._reportsInside || []} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pollution Types */}
          <div style={{ marginTop: '40px', marginBottom: '40px' }}>
            <p className="map-section-title">Pollution Types Tracked</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginTop: '16px' }}>
              {[
                { title: 'Air Pollution', desc: 'Smoke, factory emissions, and other air quality events.' },
                { title: 'Water Pollution', desc: 'Contaminated water bodies, industrial discharge, and sewage.' },
                { title: 'Waste Dumping', desc: 'Illegal disposal, garbage accumulation, and plastic pollution.' },
              ].map(({ title, desc }) => (
                <div className="card" key={title} style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{title}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
      <Footer />
    </div>
  );
};

export default MapView;
