import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { getIncidents, updateIncidentStatus, updateIncidentML } from '../utils/firestoreIncidents';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import '../styles/ecoview.css';

const STATUS_LABELS = {
  pending:    { cls: 'badge badge--amber',  text: 'Pending' },
  classified: { cls: 'badge badge--blue',   text: 'Classified' },
  verified:   { cls: 'badge badge--green',  text: 'Verified' },
  resolved:   { cls: 'badge badge--green',  text: 'Resolved' },
  rejected:   { cls: 'badge badge--red',    text: 'Rejected' },
};

const TABS = ['pending', 'classified', 'verified', 'resolved', 'rejected'];

const Spinner = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="44" strokeDashoffset="16" strokeLinecap="round" opacity="0.4" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

async function runBatchClassify(toClassify, ML_URL, updateFn) {
  let ok = 0, fail = 0;
  for (const r of toClassify) {
    try {
      // Image takes priority; fall back to text description for photo-less reports
      let payload;
      if (r.photo_data) {
        payload = { image_base64: r.photo_data };
      } else if (r.photo_url) {
        payload = { image_url: r.photo_url };
      } else {
        payload = { text_description: r.description };
      }
      const res = await fetch(`${ML_URL}/inference/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const ml = await res.json();
        await updateFn(r.id, { ml_label: ml.label, ml_confidence: ml.confidence, ml_severity: ml.severity });
        ok++;
      } else fail++;
    } catch { fail++; }
  }
  return { ok, fail };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [classifying, setClassifying] = useState(false);
  const autoClassifiedOnce = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        toast.error('Please log in.');
        return navigate('/login');
      }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (!snap.exists() || snap.data()?.role !== 'admin') {
          toast.error('Access denied. Admins only.');
          return navigate('/login');
        }
        setIsAdminVerified(true);
      } catch {
        toast.error('Error checking access.');
        return navigate('/login');
      }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!isAdminVerified) return;
    setLoading(true);
    Promise.all(
      TABS.map((s) =>
        getIncidents({ status: s, limitCount: 100 }).then((items) => [s, items])
      )
    )
      .then((entries) => {
        const loaded = Object.fromEntries(entries);
        setReports(loaded);

        // Auto-classify any pending reports that have photos but no ML label.
        // Runs once per session to catch reports whose original ML call failed
        // (e.g. while HF Space was down).
        const ML_URL = import.meta.env.VITE_ML_URL;
        if (!autoClassifiedOnce.current && ML_URL) {
          // Classify all pending reports without an ML label —
          // image-based if photo exists, text-based otherwise.
          const toClassify = (loaded.pending || []).filter((r) => !r.ml_label);
          if (toClassify.length > 0) {
            autoClassifiedOnce.current = true;
            runBatchClassify(toClassify, ML_URL, updateIncidentML).then(({ ok }) => {
              if (ok > 0) {
                toast.success(`Auto-classified ${ok} pending report${ok !== 1 ? 's' : ''}`);
                // Reload tabs so classified reports move from pending → classified
                Promise.all(
                  TABS.map((s) => getIncidents({ status: s, limitCount: 100 }).then((items) => [s, items]))
                ).then((e) => setReports(Object.fromEntries(e))).catch(() => {});
              }
            });
          }
        }
      })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [isAdminVerified]);

  const handleStatus = async (id, newStatus) => {
    setUpdating(id);
    let reportType = '';
    try {
      await updateIncidentStatus(id, newStatus);
      setReports((prev) => {
        const updated = { ...prev };
        for (const tab of TABS) {
          if (updated[tab]) {
            const item = updated[tab].find((r) => r.id === id);
            if (item) {
              reportType = item.type;
              updated[tab] = updated[tab].filter((r) => r.id !== id);
              updated[newStatus] = [{ ...item, status: newStatus }, ...(updated[newStatus] || [])];
              break;
            }
          }
        }
        return updated;
      });
      setActivityLog((prev) => [{
        id,
        type: reportType,
        newStatus,
        time: new Date(),
      }, ...prev].slice(0, 50));
      toast.success(`Report marked as ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const classifyPending = async () => {
    const ML_URL = import.meta.env.VITE_ML_URL;
    if (!ML_URL) { toast.error('VITE_ML_URL not configured'); return; }

    const toClassify = (reports.pending || []).filter(r => !r.ml_label);
    if (!toClassify.length) { toast.info('All pending reports already classified'); return; }

    setClassifying(true);
    toast.info(`Classifying ${toClassify.length} report${toClassify.length !== 1 ? 's' : ''}…`);

    const { ok, fail } = await runBatchClassify(toClassify, ML_URL, updateIncidentML);
    toast.success(`Classified ${ok}/${toClassify.length}${fail ? ` (${fail} failed)` : ''}`);

    const entries = await Promise.all(
      TABS.map(s => getIncidents({ status: s, limitCount: 100 }).then(items => [s, items]))
    );
    setReports(Object.fromEntries(entries));
    setClassifying(false);
  };

  const tabReports = reports[activeTab] || [];
  const totalPending = (reports.pending || []).length;

  return (
    <div className="app-page">
      <NavBar />

      <main className="app-page__main">
        <div className="container">
          <div className="app-page__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1>Admin Dashboard</h1>
              {totalPending > 0 && (
                <span className="badge badge--amber">{totalPending} pending</span>
              )}
              {(reports.pending || []).some(r => !r.ml_label) && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={classifyPending}
                  disabled={classifying}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {classifying ? <><Spinner /> Classifying…</> : 'Classify Pending with AI'}
                </button>
              )}
            </div>
            <p>Review, classify, and resolve community incident reports.</p>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {TABS.map((t) => (
              <div key={t} className="card" style={{ padding: '16px 24px', minWidth: '120px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--green-500)', lineHeight: 1 }}>
                  {loading ? '…' : (reports[t] || []).length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', textTransform: 'capitalize' }}>{t}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: activeTab === t ? 600 : 400,
                  color: activeTab === t ? 'var(--green-600)' : 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === t ? '2px solid var(--green-500)' : '2px solid transparent',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'color 0.15s',
                }}
              >
                {t}
                {!loading && (reports[t] || []).length > 0 && (
                  <span style={{ marginLeft: '6px', fontSize: '11px', background: 'var(--green-100)', color: 'var(--green-700)', borderRadius: '10px', padding: '1px 6px' }}>
                    {(reports[t] || []).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Report list */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px', color: 'var(--text-tertiary)' }}>
              <Spinner />
            </div>
          ) : tabReports.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No {activeTab} reports.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tabReports.map((report) => {
                const s = STATUS_LABELS[report.status] || STATUS_LABELS.pending;
                return (
                  <div key={report.id} className="card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {report.type}
                          </h4>
                          <span className={s.cls}>{s.text}</span>
                          {report.ml_label && (
                            <span className="badge badge--green" style={{ fontSize: '11px' }}>
                              {report.ml_label} · {Math.round((report.ml_confidence || 0) * 100)}%
                            </span>
                          )}
                          {report.ml_severity && (
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                              severity: {report.ml_severity}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '10px' }}>
                          {report.description}
                        </p>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
                          <span>{new Date(report.created_at).toLocaleString()}</span>
                          <span>{report.latitude?.toFixed(4)}°, {report.longitude?.toFixed(4)}°</span>
                          <span>{report.verification_count} verification{report.verification_count !== 1 ? 's' : ''}</span>
                        </div>
                        {(report.photo_data || report.photo_url) && (
                          <div style={{ marginTop: '8px', borderRadius: '6px', overflow: 'hidden', maxHeight: '120px' }}>
                            <img src={report.photo_data || report.photo_url} alt="Report photo" style={{ width: '100%', objectFit: 'cover', maxHeight: '120px', display: 'block' }} />
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                        {updating === report.id ? (
                          <div style={{ display: 'flex', justifyContent: 'center' }}><Spinner /></div>
                        ) : (
                          <>
                            {report.status !== 'verified' && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleStatus(report.id, 'verified')}
                                style={{ justifyContent: 'center' }}
                              >
                                Verify
                              </button>
                            )}
                            {report.status !== 'resolved' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleStatus(report.id, 'resolved')}
                                style={{ justifyContent: 'center' }}
                              >
                                Resolve
                              </button>
                            )}
                            {report.status !== 'rejected' && (
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleStatus(report.id, 'rejected')}
                                style={{ justifyContent: 'center', color: 'var(--red-500)', borderColor: 'var(--red-300)' }}
                              >
                                Reject
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Activity Log */}
          {activityLog.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
                Activity Log <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-tertiary)' }}>(this session)</span>
              </h3>
              <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                {activityLog.map((entry, i) => {
                  const s = STATUS_LABELS[entry.newStatus] || STATUS_LABELS.pending;
                  return (
                    <div key={`${entry.id}-${i}`} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 20px',
                      borderBottom: i < activityLog.length - 1 ? '1px solid var(--border)' : 'none',
                      fontSize: '13px',
                    }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.newStatus === 'verified' || entry.newStatus === 'resolved' ? 'var(--green-500)' : entry.newStatus === 'rejected' ? '#ef4444' : '#d97706', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{entry.type || 'Report'}</span>
                        {' '}marked as{' '}
                        <span className={s.cls} style={{ fontSize: '11px' }}>{s.text}</span>
                      </span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav />
      <Footer />
    </div>
  );
};

export default AdminDashboard;
