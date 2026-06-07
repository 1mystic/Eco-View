import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import { getNewNGOInvites } from '../utils/services';
import '../styles/ecoview.css';

const STATUS = {
  pending:  { cls: 'badge badge--amber', label: 'Pending' },
  approved: { cls: 'badge badge--green', label: 'Approved' },
  rejected: { cls: 'badge badge--red',   label: 'Rejected' },
};

const Spinner = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="44" strokeDashoffset="16" strokeLinecap="round" opacity="0.4" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const DocIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2" y="1" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M4 4h4M4 6.5h4M4 9h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M9 1v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

function NGOInvite() {
  const navigate = useNavigate();
  const [invites, setInvites]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter]     = useState('all');

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
      } catch {
        toast.error('Error checking access.');
        return navigate('/login');
      }
    });
    return () => unsub();
  }, [navigate]);

  const loadInvites = async () => {
    try {
      const data = await getNewNGOInvites();
      setInvites(data);
    } catch {
      toast.error('Failed to load NGO applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvites(); }, []);

  const changeStatus = async (ngoId, newStatus) => {
    setUpdating(ngoId + newStatus);
    try {
      await updateDoc(doc(db, 'users', ngoId), { approvalStatus: newStatus });
      toast.success(`NGO ${newStatus}`);
      await loadInvites();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'all' ? invites : invites.filter((n) => n.approvalStatus === filter);
  const counts = { all: invites.length, pending: 0, approved: 0, rejected: 0 };
  invites.forEach((n) => { if (counts[n.approvalStatus] !== undefined) counts[n.approvalStatus]++; });

  return (
    <div className="app-page">
      <NavBar />

      <main className="app-page__main">
        <div className="container">
          <div className="app-page__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1>NGO Verification</h1>
              {counts.pending > 0 && (
                <span className="badge badge--amber">{counts.pending} pending</span>
              )}
            </div>
            <p>Review and approve NGO applications to grant campaign management access.</p>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
            {[
              { key: 'all',      label: 'Total' },
              { key: 'pending',  label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
            ].map(({ key, label }) => (
              <div
                key={key}
                className="card"
                onClick={() => setFilter(key)}
                style={{
                  padding: '16px 24px',
                  minWidth: '110px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: filter === key ? '2px solid var(--green-400)' : '1px solid var(--border)',
                  transition: 'border 0.15s',
                }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--green-500)', lineHeight: 1 }}>
                  {loading ? '…' : counts[key]}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', textTransform: 'capitalize' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px', color: 'var(--text-tertiary)' }}>
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: '56px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', marginBottom: '12px' }}>🌿</p>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                No {filter === 'all' ? '' : filter} applications
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                NGO registrations will appear here when submitted.
              </p>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Organization', 'Reg. Number', 'Contact Person', 'Phone', 'Status', 'Actions', 'Document'].map((h) => (
                        <th key={h} style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--text-tertiary)',
                          background: 'var(--surface-secondary)',
                          whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((ngo, i) => {
                      const s = STATUS[ngo.approvalStatus] || STATUS.pending;
                      return (
                        <tr
                          key={ngo.id}
                          style={{
                            borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-secondary)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            {ngo.name || ngo.organization || '—'}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            {ngo.regNum || '—'}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {ngo.contactPerson || '—'}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {ngo.contactNo || '—'}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span className={s.cls} style={{ textTransform: 'capitalize' }}>{s.label}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {ngo.approvalStatus !== 'approved' && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => changeStatus(ngo.id, 'approved')}
                                  disabled={!!updating}
                                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px' }}
                                >
                                  {updating === ngo.id + 'approved' ? <Spinner /> : <><CheckIcon /> Approve</>}
                                </button>
                              )}
                              {ngo.approvalStatus !== 'rejected' && (
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={() => changeStatus(ngo.id, 'rejected')}
                                  disabled={!!updating}
                                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', color: 'var(--red-500)', borderColor: 'var(--red-300)' }}
                                >
                                  {updating === ngo.id + 'rejected' ? <Spinner /> : <><XIcon /> Reject</>}
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {ngo.docProofURL ? (
                              <a
                                href={ngo.docProofURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', textDecoration: 'none' }}
                              >
                                <DocIcon /> View Doc
                              </a>
                            ) : (
                              <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>No doc</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav />
      <Footer />
    </div>
  );
}

export default NGOInvite;
