import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { getUserIncidents, getUserCampaigns } from '../utils/firestoreIncidents';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import '../styles/ecoview.css';

const STATUS_COLORS = {
  pending:    { badge: 'badge badge--amber',  label: 'Pending' },
  classified: { badge: 'badge badge--blue',   label: 'Classified' },
  verified:   { badge: 'badge badge--green',  label: 'Verified' },
  resolved:   { badge: 'badge badge--green',  label: 'Resolved' },
  rejected:   { badge: 'badge badge--red',    label: 'Rejected' },
};

const Spinner = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="3" strokeDasharray="56" strokeDashoffset="20" strokeLinecap="round" opacity="0.4" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const UserDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser]             = useState(null);
  const [firestoreUser, setFsUser]  = useState(null);
  const [reports, setReports]       = useState([]);
  const [campaigns, setCampaigns]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab]   = useState('reports');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        toast.error('Please log in to access the dashboard.');
        return navigate('/login');
      }
      if (firebaseUser.uid !== id) {
        toast.error('Access denied.');
        return navigate('/login');
      }
      setUser({
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        email: firebaseUser.email || '',
        createdAt: firebaseUser.metadata?.creationTime,
      });
      // Load Firestore profile for points and role
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) setFsUser(snap.data());
      } catch { /* ignore */ }
      setLoading(false);
    });
    return () => unsub();
  }, [navigate, id]);

  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    Promise.all([
      getUserIncidents(user.uid),
      getUserCampaigns(user.uid),
    ])
      .then(([r, c]) => { setReports(r); setCampaigns(c); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setDataLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="app-page">
        <NavBar />
        <main className="app-page__main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Spinner />
            <p style={{ marginTop: '16px' }}>Loading profile…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const verified = reports.filter((r) => r.status === 'verified' || r.status === 'resolved').length;
  const pending  = reports.filter((r) => r.status === 'pending' || r.status === 'classified').length;
  const points   = firestoreUser?.points || 0;

  return (
    <div className="app-page">
      <NavBar />

      <main className="app-page__main">
        <div className="container">
          <div className="app-page__header">
            <h1>Dashboard</h1>
            <p>Track your environmental reports and community impact.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px', alignItems: 'start' }}>
            {/* Profile card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
                <div className="testimonial-card__avatar" style={{ margin: '0 auto 16px', width: '64px', height: '64px', fontSize: '24px', lineHeight: '64px' }}>
                  {user.name[0].toUpperCase()}
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {user.name}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '20px' }}>{user.email}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  {[
                    { label: 'Reports', value: reports.length },
                    { label: 'Verified', value: verified },
                    { label: 'Points', value: points },
                  ].map(({ label, value }) => (
                    <div key={label} className="card" style={{ padding: '12px', background: 'var(--surface-secondary)', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--green-500)', lineHeight: 1 }}>{value}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{label}</div>
                    </div>
                  ))}
                </div>

                <Link to="/report" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  Submit New Report
                </Link>
              </div>

              {pending > 0 && (
                <div className="card" style={{ padding: '16px', background: 'var(--amber-50)', border: '1px solid var(--amber-200)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--amber-800)', lineHeight: 1.55 }}>
                    <strong>{pending} report{pending !== 1 ? 's' : ''}</strong> awaiting classification or verification.
                  </p>
                </div>
              )}

              {campaigns.length > 0 && (
                <div className="card" style={{ padding: '16px', background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--green-700)', marginBottom: '8px' }}>
                    Joined Campaigns
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--green-800)', fontWeight: 600 }}>{campaigns.length} active</p>
                  <Link to="/campaigns" style={{ fontSize: '12px', color: 'var(--green-600)', marginTop: '4px', display: 'inline-block' }}>View all campaigns →</Link>
                </div>
              )}
            </div>

            {/* Main content */}
            <div>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
                {[['reports', 'My Reports'], ['campaigns', 'Campaigns']].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: activeTab === key ? 600 : 400,
                      color: activeTab === key ? 'var(--green-600)' : 'var(--text-secondary)',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === key ? '2px solid var(--green-500)' : '2px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {dataLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: 'var(--text-tertiary)' }}>
                  <Spinner />
                </div>
              ) : activeTab === 'reports' ? (
                reports.length === 0 ? (
                  <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                    <p style={{ fontSize: '32px', marginBottom: '12px' }}>📍</p>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No reports yet</h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Submit your first pollution report to start making an impact.</p>
                    <Link to="/report" className="btn btn-primary btn-sm">Submit First Report</Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reports.map((report) => {
                      const s = STATUS_COLORS[report.status] || STATUS_COLORS.pending;
                      return (
                        <div key={report.id} className="card" style={{ padding: '20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{report.type}</h4>
                                <span className={s.badge}>{s.label}</span>
                                {report.ml_label && (
                                  <span className="badge badge--green" style={{ fontSize: '11px' }}>
                                    AI: {report.ml_label} · {Math.round((report.ml_confidence || 0) * 100)}%
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>
                                {report.description}
                              </p>
                              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
                                <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                <span>{report.latitude?.toFixed(3)}°, {report.longitude?.toFixed(3)}°</span>
                                {!report.ml_label && report.photo_data && (
                                  <span style={{ color: 'var(--amber-700)' }}>AI classification pending</span>
                                )}
                              </div>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                              {report.verification_count} verification{report.verification_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {report.photo_data && (
                            <div style={{ marginTop: '12px', borderRadius: '6px', overflow: 'hidden', maxHeight: '140px' }}>
                              <img
                                src={report.photo_data}
                                alt="Report photo"
                                style={{ width: '100%', objectFit: 'cover', maxHeight: '140px', display: 'block' }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                campaigns.length === 0 ? (
                  <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                    <p style={{ fontSize: '32px', marginBottom: '12px' }}>🌿</p>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No campaigns joined yet</h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Join an NGO campaign to make a greater collective impact.</p>
                    <Link to="/campaigns" className="btn btn-primary btn-sm">Browse Campaigns</Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {campaigns.map((c) => (
                      <div key={c.id} className="card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px', flexWrap: 'wrap' }}>
                          <div>
                            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{c.title}</h4>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{c.description}</p>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
                              <span>by {c.ngo_name}</span>
                              <span>{c.target_location}</span>
                              <span>{c.signup_count} volunteers</span>
                            </div>
                          </div>
                          <span className={c.status === 'active' ? 'badge badge--green' : 'badge badge--amber'} style={{ textTransform: 'capitalize' }}>
                            {c.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
      <Footer />
    </div>
  );
};

export default UserDashboard;
