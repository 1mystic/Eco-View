import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { auth } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { createIncident, awardReportPoints, updateIncidentML } from '../utils/firestoreIncidents';
import { uploadPollutionImage } from '../utils/firestoreStorage';
import { incidentTypes } from '../utils/services';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import '../styles/ecoview.css';

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 1.5L17.5 15H2.5L10 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M10 7.5v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="10" cy="13.5" r="0.75" fill="currentColor" />
  </svg>
);

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6c0-2.485-2.015-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5.5 4l1-2h3l1 2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2.5 8.5l4 4 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Spinner = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" opacity="0.5" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const Report = () => {
  const navigate = useNavigate();

  const [user, setUser]                 = useState(null);
  const [isAdmin, setIsAdmin]           = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [location, setLocation]         = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUpload, setFileUpload]     = useState(null);
  const fileInputRef                    = useRef(null);

  const [formData, setFormData] = useState({ type: '', description: '' });
  const [errors, setErrors]     = useState({ type: '', description: '' });

  /* Auth check */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const snap = await getDoc(doc(db, 'users', currentUser.uid));
          if (snap.exists() && snap.data().role === 'admin') {
            setIsAdmin(true);
            toast.error('Admin users cannot submit reports.');
            navigate('/admin');
          } else {
            setUser({ id: snap.id, ...snap.data() });
          }
        } catch { /* ignore */ }
      }
      setCheckingRole(false);
    });
    return () => unsub();
  }, [navigate]);

  /* Geolocation */
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocation({ latitude: coords.latitude, longitude: coords.longitude }),
      () => setLocationError('Unable to get your location. Please enable location services.')
    );
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = { type: '', description: '' };
    let ok = true;
    if (!formData.type) { e.type = 'Please select a pollution type'; ok = false; }
    if (!formData.description) { e.description = 'Description is required'; ok = false; }
    else if (formData.description.length < 10) { e.description = 'Description must be at least 10 characters'; ok = false; }
    else if (formData.description.length > 1000) { e.description = 'Description must be less than 1000 characters'; ok = false; }
    setErrors(e);
    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!location) { toast.error('Location data is required. Please enable location services.'); return; }
    setIsSubmitting(true);

    try {
      // 1. Compress image client-side → base64 data URL (no external storage needed)
      let photo_data = null;
      if (fileUpload) {
        try {
          photo_data = await uploadPollutionImage(fileUpload);
        } catch {
          toast.error('Image compression failed — submitting without photo.');
        }
      }

      // 2. Save incident to Firestore
      const incidentId = await createIncident({
        type: formData.type,
        description: formData.description,
        photo_data,
        latitude: location.latitude,
        longitude: location.longitude,
        reporter_uid: user?.id || null,
        reporter_name: user?.name || 'Anonymous',
      });

      // 3. Award points to reporter
      if (user?.id) await awardReportPoints(user.id);

      // 4. Fire-and-forget ML classification via HF Space (base64 supported)
      const ML_URL = import.meta.env.VITE_ML_URL;
      if (ML_URL && photo_data) {
        (async () => {
          try {
            const res = await fetch(`${ML_URL}/inference/classify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_base64: photo_data }),
            });
            if (res.ok) {
              const ml = await res.json();
              await updateIncidentML(incidentId, {
                ml_label: ml.label,
                ml_confidence: ml.confidence,
                ml_severity: ml.severity,
              });
            }
          } catch { /* ML is best-effort — never block the user flow */ }
        })();
      }

      // 4. Reset form and notify user
      setFormData({ type: '', description: '' });
      setFileUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      toast.success('Report submitted!', {
        description: 'Your report is live on the map.',
      });
    } catch (err) {
      toast.error('Failed to submit report. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingRole || isAdmin) return null;

  return (
    <div className="map-page">
      <NavBar />

      <main className="map-page__main">
        <div className="container">
          <div className="app-page__header">
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Submit a Pollution Report
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
              Report environmental incidents in your area. All submissions are reviewed and classified by our AI model.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', alignItems: 'start' }}>
            {/* Main form */}
            <div className="report-card">
              <div className="report-card__head">
                <h2>
                  <span className="icon-circle icon-circle--sm" style={{ color: 'var(--green-600)' }}>
                    <AlertIcon />
                  </span>
                  Incident Details
                </h2>
                <p>Provide as much detail as possible to help our team classify the incident accurately.</p>
              </div>

              <div className="report-card__body">
                <form onSubmit={handleSubmit}>
                  {/* Pollution type */}
                  <div className="form-field">
                    <label htmlFor="type" className="form-label">Pollution Type</label>
                    <select
                      id="type" name="type"
                      className="form-select"
                      value={formData.type}
                      onChange={handleChange}
                    >
                      <option value="">Select type of pollution</option>
                      {incidentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.type && <p className="form-error">{errors.type}</p>}
                  </div>

                  {/* Description */}
                  <div className="form-field">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                      id="description" name="description"
                      className="form-textarea"
                      placeholder="Describe the pollution issue in detail — scale, duration, visible sources, any other context..."
                      value={formData.description}
                      onChange={handleChange}
                      style={{ minHeight: '140px' }}
                    />
                    {errors.description && <p className="form-error">{errors.description}</p>}
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      {formData.description.length}/1000 characters
                    </p>
                  </div>

                  {/* Photo */}
                  <div className="form-field">
                    <label className="form-label">
                      <CameraIcon /> Photo Evidence <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span>
                    </label>
                    <label className="form-file" htmlFor="file-upload" style={{ display: 'block', cursor: 'pointer' }}>
                      <input
                        id="file-upload"
                        type="file" accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => setFileUpload(e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                      {fileUpload ? (
                        <span style={{ color: 'var(--green-700)', fontWeight: 500 }}>
                          ✓ {fileUpload.name}
                        </span>
                      ) : (
                        <span>Click to upload a photo · JPEG, PNG, HEIC · Max 10MB</span>
                      )}
                    </label>

                    {fileUpload && (
                      <div style={{ marginTop: '12px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: '220px' }}>
                        <img
                          src={URL.createObjectURL(fileUpload)}
                          alt="Preview"
                          style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div className="form-field">
                    <label className="form-label"><PinIcon /> Location</label>
                    {location ? (
                      <div className="location-box">
                        <span style={{ fontSize: '14px', color: 'var(--green-800)', fontWeight: 500 }}>Location captured</span>
                        <span className="location-coords">
                          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                        </span>
                      </div>
                    ) : locationError ? (
                      <div className="location-box location-box--error">
                        <AlertIcon />
                        <span style={{ fontSize: '14px', color: '#dc2626' }}>{locationError}</span>
                      </div>
                    ) : (
                      <div className="location-box location-box--loading">
                        <Spinner />
                        <span style={{ fontSize: '14px', color: '#92400e' }}>Detecting your location…</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || !location}
                    style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: 'var(--radius-md)' }}
                  >
                    {isSubmitting ? <><Spinner /> Submitting…</> : 'Submit Report'}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Reporter info */}
              <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                  Reporting as
                </p>
                {user ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="testimonial-card__avatar">{user.name?.[0]?.toUpperCase() ?? '?'}</div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>+10 pts per verified report</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Anonymous</p>
                    <Link to="/login" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                      Sign in to track reports & earn points
                    </Link>
                  </div>
                )}
              </div>

              {/* What happens next */}
              <div className="card" style={{ padding: '20px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                  What happens next
                </p>
                <div className="report-info-row">
                  {[
                    { icon: <CheckIcon />, text: 'AI model classifies your image in the background' },
                    { icon: <CheckIcon />, text: 'Report is pinned live on the public map' },
                    { icon: <CheckIcon />, text: 'Community members can verify your report' },
                    { icon: <CheckIcon />, text: 'Admin review within 24–48 hours' },
                  ].map(({ icon, text }) => (
                    <div className="report-info-item" key={text}>
                      <div className="icon-circle icon-circle--sm" style={{ flexShrink: 0 }}>{icon}</div>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="card" style={{ padding: '20px', background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--green-700)', marginBottom: '10px' }}>
                  Tips for better reports
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    'Shoot in daylight for best AI classification',
                    'Include scale references in description',
                    'Enable location for accurate pinning',
                  ].map((t) => (
                    <li key={t} style={{ fontSize: '13px', color: 'var(--green-800)', lineHeight: 1.5, display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--green-500)', marginTop: '2px', flexShrink: 0 }}>→</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
      <Footer />
    </div>
  );
};

export default Report;
