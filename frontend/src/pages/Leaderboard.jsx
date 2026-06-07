import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getLeaderboard, getPlatformStats } from '../utils/firestoreIncidents';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import '../styles/ecoview.css';

const MEDAL = ['🥇', '🥈', '🥉'];

const Spinner = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="44" strokeDashoffset="16" strokeLinecap="round" opacity="0.4" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const Leaderboard = () => {
  const [currentUid, setCurrentUid] = useState(null);
  const [entries, setEntries]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUid(u?.uid || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    Promise.all([getLeaderboard(50), getPlatformStats()])
      .then(([lb, s]) => { setEntries(lb); setStats(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Firestore users have 'id' as their UID key
  const myRank = currentUid ? entries.findIndex((e) => e.id === currentUid) + 1 : 0;

  return (
    <div className="app-page">
      <NavBar />

      <main className="app-page__main">
        <div className="container">
          <div className="app-page__header">
            <h1>Leaderboard</h1>
            <p>Top community contributors ranked by verified reports and points.</p>
          </div>

          {/* Platform stats */}
          {stats && (
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Incidents', value: stats.total_incidents.toLocaleString() },
                { label: 'Verified', value: stats.verified_incidents.toLocaleString() },
                { label: 'Resolved', value: stats.resolved_incidents.toLocaleString() },
                { label: 'Contributors', value: stats.total_reporters.toLocaleString() },
                { label: 'Today', value: stats.incidents_today.toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="card" style={{ padding: '16px 20px', minWidth: '110px', textAlign: 'center', flex: '1 1 100px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--green-500)', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {myRank > 0 && (
            <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', background: 'var(--green-50)', border: '1px solid var(--green-200)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🎯</span>
              <p style={{ fontSize: '14px', color: 'var(--green-800)' }}>
                You are ranked <strong>#{myRank}</strong> on the leaderboard
                {entries[myRank - 1] ? ` with ${entries[myRank - 1].points ?? 0} points` : ''}.
              </p>
            </div>
          )}

          {/* Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '64px', color: 'var(--text-tertiary)' }}>
                <Spinner />
              </div>
            ) : entries.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No contributors yet. <Link to="/report" style={{ color: 'var(--green-600)' }}>Be the first to report</Link>.
              </div>
            ) : (
              <div>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 100px', gap: '16px', padding: '12px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}>
                  <span>#</span>
                  <span>Contributor</span>
                  <span style={{ textAlign: 'right' }}>Points</span>
                </div>
                {entries.map((entry, i) => {
                  const isMe = entry.id === currentUid;
                  return (
                    <div
                      key={entry.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '48px 1fr 100px',
                        gap: '16px',
                        padding: '14px 20px',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--border)',
                        background: isMe ? 'var(--green-50)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: i < 3 ? 'var(--green-500)' : 'var(--text-tertiary)' }}>
                        {i < 3 ? MEDAL[i] : `#${i + 1}`}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="testimonial-card__avatar" style={{ width: '32px', height: '32px', fontSize: '13px', lineHeight: '32px', flexShrink: 0 }}>
                          {(entry.name || '?')[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: isMe ? 600 : 400, color: 'var(--text-primary)' }}>
                          {entry.name || 'Anonymous'}
                          {isMe && <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--green-600)' }}>· you</span>}
                        </span>
                      </div>
                      <span style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--green-500)' }}>
                        {entry.points ?? 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!currentUid && (
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Sign in to track your rank and earn contribution points.
              </p>
              <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav />
      <Footer />
    </div>
  );
};

export default Leaderboard;
