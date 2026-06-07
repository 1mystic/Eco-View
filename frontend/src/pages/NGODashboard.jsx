import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import {
  getNGOCampaigns,
  createCampaign,
  updateCampaign,
  getIncidents,
  updateIncidentStatus,
} from '../utils/firestoreIncidents';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import '../styles/ecoview.css';

const Spinner = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="44" strokeDashoffset="16" strokeLinecap="round" opacity="0.4" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const EMPTY_CAMPAIGN = { title: '', description: '', target_location: '', start_date: '', end_date: '' };

const NGODashboard = () => {
  const navigate = useNavigate();
  const [ngoUser, setNgoUser]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [campaigns, setCampaigns]   = useState([]);
  const [nearbyReports, setNearby]  = useState([]);
  const [activeTab, setActiveTab]   = useState('campaigns');
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_CAMPAIGN);
  const [saving, setSaving]         = useState(false);
  const [resolving, setResolving]   = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { toast.error('Please log in.'); return navigate('/login'); }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (!snap.exists()) { toast.error('Account not found.'); return navigate('/login'); }
        const data = snap.data();
        if (data.role !== 'ngo') { toast.error('NGO accounts only.'); return navigate('/login'); }
        if (data.approvalStatus !== 'approved') {
          toast.error('Your NGO account is pending approval by an admin.');
          return navigate('/');
        }
        setNgoUser({ id: user.uid, ...data });
      } catch {
        toast.error('Error loading account.');
        return navigate('/login');
      }
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!ngoUser) return;
    Promise.all([
      getNGOCampaigns(ngoUser.id),
      getIncidents({ limitCount: 50 }),
    ])
      .then(([cList, rList]) => {
        setCampaigns(cList);
        // Show recent unresolved reports for "action taken" flow
        setNearby(rList.filter((r) => r.status !== 'resolved' && r.status !== 'rejected'));
      })
      .catch(() => toast.error('Failed to load data'));
  }, [ngoUser]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.target_location || !form.start_date || !form.end_date) {
      toast.error('All campaign fields are required.');
      return;
    }
    setSaving(true);
    try {
      const id = await createCampaign({
        ...form,
        ngo_uid: ngoUser.id,
        ngo_name: ngoUser.organization || ngoUser.name,
        start_date: new Date(form.start_date),
        end_date: new Date(form.end_date),
      });
      setCampaigns((prev) => [{ id, ...form, ngo_uid: ngoUser.id, ngo_name: ngoUser.organization || ngoUser.name, signup_count: 0, status: 'active', volunteers: [] }, ...prev]);
      setForm(EMPTY_CAMPAIGN);
      setShowForm(false);
      toast.success('Campaign created!');
    } catch (err) {
      toast.error('Failed to create campaign.');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteCampaign = async (id) => {
    try {
      await updateCampaign(id, { status: 'completed' });
      setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: 'completed' } : c));
      toast.success('Campaign marked as completed.');
    } catch {
      toast.error('Failed to update campaign.');
    }
  };

  const handleResolveReport = async (reportId) => {
    setResolving(reportId);
    try {
      await updateIncidentStatus(reportId, 'resolved');
      setNearby((prev) => prev.filter((r) => r.id !== reportId));
      toast.success('Report marked as resolved — thank you for taking action!');
    } catch {
      toast.error('Failed to update report status.');
    } finally {
      setResolving(null);
    }
  };

  if (loading) {
    return (
      <div className="app-page">
        <NavBar />
        <main className="app-page__main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </main>
        <Footer />
      </div>
    );
  }

  const activeCampaigns   = campaigns.filter((c) => c.status === 'active');
  const completedCampaigns = campaigns.filter((c) => c.status !== 'active');

  return (
    <div className="app-page">
      <NavBar />

      <main className="app-page__main">
        <div className="container">
          <div className="app-page__header">
            <h1>NGO Dashboard</h1>
            <p>Manage campaigns, take action on reports, and track your organisation's impact.</p>
          </div>

          {/* Profile strip */}
          <div className="card" style={{ padding: '20px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div className="testimonial-card__avatar" style={{ width: '52px', height: '52px', fontSize: '20px', lineHeight: '52px', flexShrink: 0 }}>
              {(ngoUser.organization || ngoUser.name || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {ngoUser.organization || ngoUser.name}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{ngoUser.email}</p>
            </div>
            <span className="badge badge--green">Approved NGO</span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {[
              { label: 'Active Campaigns', value: activeCampaigns.length },
              { label: 'Completed Campaigns', value: completedCampaigns.length },
              { label: 'Total Volunteers', value: campaigns.reduce((s, c) => s + (c.signup_count || 0), 0) },
              { label: 'Reports to Action', value: nearbyReports.length },
            ].map(({ label, value }) => (
              <div key={label} className="card" style={{ padding: '16px 24px', textAlign: 'center', flex: '1 1 120px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--green-500)', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
            {[['campaigns', 'My Campaigns'], ['action', 'Action Required'], ['create', 'Create Campaign']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); if (key === 'create') setShowForm(true); }}
                style={{
                  padding: '10px 20px', fontSize: '14px',
                  fontWeight: activeTab === key ? 600 : 400,
                  color: activeTab === key ? 'var(--green-600)' : 'var(--text-secondary)',
                  background: 'none', border: 'none',
                  borderBottom: activeTab === key ? '2px solid var(--green-500)' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {label}
                {key === 'action' && nearbyReports.length > 0 && (
                  <span style={{ marginLeft: '6px', fontSize: '11px', background: '#fef3c7', color: '#92400e', borderRadius: '10px', padding: '1px 6px' }}>
                    {nearbyReports.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Campaigns list */}
          {activeTab === 'campaigns' && (
            <div>
              {campaigns.length === 0 ? (
                <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                  <p style={{ fontSize: '32px', marginBottom: '12px' }}>🌿</p>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>No campaigns yet</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Create your first campaign to recruit volunteers and drive environmental action.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('create')}>Create Campaign</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {campaigns.map((c) => (
                    <div key={c.id} className="card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</h4>
                            <span className={c.status === 'active' ? 'badge badge--green' : 'badge badge--amber'} style={{ textTransform: 'capitalize' }}>{c.status}</span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '8px' }}>{c.description}</p>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
                            <span>📍 {c.target_location}</span>
                            <span>👥 {c.signup_count || 0} volunteers</span>
                            {c.start_date && <span>📅 {new Date(c.start_date?.seconds ? c.start_date.seconds * 1000 : c.start_date).toLocaleDateString()} – {new Date(c.end_date?.seconds ? c.end_date.seconds * 1000 : c.end_date).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        {c.status === 'active' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCompleteCampaign(c.id)}
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action required — reports NGO can mark as resolved */}
          {activeTab === 'action' && (
            <div>
              {nearbyReports.length === 0 ? (
                <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '32px', marginBottom: '8px' }}>✅</p>
                  <p style={{ fontSize: '15px', fontWeight: 600 }}>No pending reports — great work!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {nearbyReports.map((r) => (
                    <div key={r.id} className="card" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.type}</h4>
                          <span className="badge badge--amber" style={{ textTransform: 'capitalize' }}>{r.status}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '6px' }}>{r.description}</p>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          {r.latitude?.toFixed(4)}°, {r.longitude?.toFixed(4)}° · {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleResolveReport(r.id)}
                        disabled={resolving === r.id}
                      >
                        {resolving === r.id ? <Spinner /> : 'Action Taken'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create campaign form */}
          {activeTab === 'create' && (
            <div className="report-card" style={{ maxWidth: '600px' }}>
              <div className="report-card__head">
                <h2>Create a Campaign</h2>
                <p>Recruit volunteers and coordinate environmental action in your target area.</p>
              </div>
              <div className="report-card__body">
                <form onSubmit={handleCreateCampaign}>
                  {[
                    { name: 'title', label: 'Campaign Title', placeholder: 'e.g. Clean Yamuna Drive — Delhi' },
                    { name: 'target_location', label: 'Target Location', placeholder: 'e.g. Yamuna River, New Delhi' },
                  ].map(({ name, label, placeholder }) => (
                    <div className="form-field" key={name}>
                      <label className="form-label">{label}</label>
                      <input
                        type="text" name={name} className="form-select"
                        placeholder={placeholder}
                        value={form[name]} onChange={handleFormChange}
                        style={{ padding: '10px 12px' }}
                      />
                    </div>
                  ))}

                  <div className="form-field">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description" className="form-textarea"
                      placeholder="Describe the campaign goals, activities, and what volunteers will do…"
                      value={form.description} onChange={handleFormChange}
                      style={{ minHeight: '100px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {[
                      { name: 'start_date', label: 'Start Date', type: 'date' },
                      { name: 'end_date',   label: 'End Date',   type: 'date' },
                    ].map(({ name, label, type }) => (
                      <div className="form-field" key={name}>
                        <label className="form-label">{label}</label>
                        <input
                          type={type} name={name} className="form-select"
                          value={form[name]} onChange={handleFormChange}
                          style={{ padding: '10px 12px' }}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit" className="btn btn-primary"
                    disabled={saving}
                    style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: 'var(--radius-md)' }}
                  >
                    {saving ? <Spinner /> : 'Create Campaign'}
                  </button>
                </form>
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

export default NGODashboard;
