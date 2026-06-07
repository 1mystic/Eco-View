import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import { getCampaigns, joinCampaign, leaveCampaign } from '../utils/firestoreIncidents';
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

const Campaigns = () => {
  const [currentUid, setCurrentUid]   = useState(null);
  const [campaigns, setCampaigns]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('active');
  const [actioning, setActioning]     = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUid(u?.uid || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    getCampaigns({ status: filter === 'all' ? undefined : filter })
      .then(setCampaigns)
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  }, [filter]);

  const handleJoin = async (campaignId, volunteers) => {
    if (!currentUid) { toast.error('Sign in to join campaigns.'); return; }
    setActioning(campaignId);
    const isJoined = volunteers?.includes(currentUid);
    try {
      if (isJoined) {
        await leaveCampaign(campaignId, currentUid);
        setCampaigns((prev) => prev.map((c) => c.id === campaignId
          ? { ...c, volunteers: c.volunteers.filter((v) => v !== currentUid), signup_count: Math.max(0, (c.signup_count || 1) - 1) }
          : c
        ));
        toast.success('You have left the campaign.');
      } else {
        await joinCampaign(campaignId, currentUid);
        setCampaigns((prev) => prev.map((c) => c.id === campaignId
          ? { ...c, volunteers: [...(c.volunteers || []), currentUid], signup_count: (c.signup_count || 0) + 1 }
          : c
        ));
        toast.success('Joined campaign! Thank you for volunteering.');
      }
    } catch (err) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="app-page">
      <NavBar />

      <main className="app-page__main">
        <div className="container">
          <div className="app-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1>Campaigns</h1>
              <p>NGO-led environmental action drives. Join a campaign and make a collective impact.</p>
            </div>
            {!currentUid && (
              <Link to="/login" className="btn btn-primary btn-sm">Sign in to join</Link>
            )}
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[['active', 'Active'], ['completed', 'Completed'], ['all', 'All']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setFilter(key); setLoading(true); }}
                style={{
                  padding: '8px 18px', borderRadius: '20px',
                  fontSize: '13px', fontWeight: filter === key ? 600 : 400,
                  background: filter === key ? 'var(--green-500)' : 'var(--surface-secondary)',
                  color: filter === key ? 'white' : 'var(--text-secondary)',
                  border: 'none', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px', color: 'var(--text-tertiary)' }}>
              <Spinner />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="card" style={{ padding: '64px', textAlign: 'center' }}>
              <p style={{ fontSize: '40px', marginBottom: '16px' }}>🌱</p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                No {filter === 'all' ? '' : filter} campaigns yet
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                NGOs can create campaigns from their{' '}
                <Link to="/ngo-dashboard" style={{ color: 'var(--green-600)' }}>NGO Dashboard</Link>.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {campaigns.map((c) => {
                const isJoined = c.volunteers?.includes(currentUid);
                const isExpired = c.end_date && new Date(c.end_date?.seconds ? c.end_date.seconds * 1000 : c.end_date) < new Date();
                const canJoin = c.status === 'active' && !isExpired;

                return (
                  <div key={c.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span
                        className={c.status === 'active' ? 'badge badge--green' : 'badge badge--amber'}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {isExpired && c.status === 'active' ? 'Ended' : c.status}
                      </span>
                      {isJoined && (
                        <span style={{ fontSize: '12px', color: 'var(--green-600)', fontWeight: 600 }}>✓ Joined</span>
                      )}
                    </div>

                    {/* Content */}
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {c.title}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {c.description}
                      </p>
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🏢</span>
                        <span>{c.ngo_name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📍</span>
                        <span>{c.target_location}</span>
                      </div>
                      {c.start_date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>📅</span>
                          <span>
                            {new Date(c.start_date?.seconds ? c.start_date.seconds * 1000 : c.start_date).toLocaleDateString()}
                            {' – '}
                            {new Date(c.end_date?.seconds ? c.end_date.seconds * 1000 : c.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Volunteer count progress */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'var(--surface-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--green-500)', width: `${Math.min(100, (c.signup_count || 0) * 5)}%`, borderRadius: '3px', transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {c.signup_count || 0} volunteers
                      </span>
                    </div>

                    {/* Action */}
                    {canJoin ? (
                      <button
                        className={isJoined ? 'btn btn-outline btn-sm' : 'btn btn-primary btn-sm'}
                        onClick={() => handleJoin(c.id, c.volunteers)}
                        disabled={actioning === c.id}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {actioning === c.id ? <Spinner /> : isJoined ? 'Leave Campaign' : 'Join Campaign'}
                      </button>
                    ) : (
                      <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', paddingTop: '4px' }}>
                        This campaign has ended · {c.signup_count || 0} volunteers participated
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav />
      <Footer />
    </div>
  );
};

export default Campaigns;
