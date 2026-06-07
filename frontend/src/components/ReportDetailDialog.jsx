import { useState } from 'react';
import { auth } from '../config/firebase';
import { verifyIncident } from '../utils/firestoreIncidents';
import { toast } from 'sonner';

const STATUS_MAP = {
  pending:    { cls: 'badge badge--amber',  label: 'Pending' },
  classified: { cls: 'badge badge--blue',   label: 'Classified' },
  verified:   { cls: 'badge badge--green',  label: 'Verified' },
  resolved:   { cls: 'badge badge--green',  label: 'Resolved' },
  rejected:   { cls: 'badge badge--red',    label: 'Rejected' },
};

const SEV_COLORS = { low: '#16a34a', medium: '#d97706', high: '#dc2626', critical: '#7c3aed' };

// Inline dialog — rendered as an overlay anchored to the map container.
// `onClose` closes it; `onVerified` refreshes the parent's report list.
const ReportDetailDialog = ({ report, onClose, onVerified }) => {
  const [verifying, setVerifying] = useState(false);
  const currentUser = auth.currentUser;

  const canVerify =
    currentUser &&
    currentUser.uid !== report.reporter_uid &&
    !(report.verifiers || []).includes(currentUser.uid) &&
    report.status !== 'resolved' &&
    report.status !== 'rejected';

  const handleVerify = async () => {
    if (!currentUser) return;
    setVerifying(true);
    try {
      await verifyIncident(report.id, currentUser.uid);
      toast.success('Report verified! +5 points awarded.');
      onVerified?.(report.id);
    } catch (err) {
      toast.error(err.message || 'Could not verify report.');
    } finally {
      setVerifying(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/map-view?report=${report.id}`;
    if (navigator.share) {
      await navigator.share({ title: `EcoView: ${report.type}`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const s = STATUS_MAP[report.status] || STATUS_MAP.pending;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--surface-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          maxWidth: '480px',
          width: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-tertiary)' }}
          aria-label="Close"
        >×</button>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{report.type}</h3>
            <span className={s.cls}>{s.label}</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{report.description}</p>
        </div>

        {/* Photo — supports both legacy photo_url (HTTP) and new photo_data (base64) */}
        {(report.photo_data || report.photo_url) && (
          <div style={{ marginBottom: '20px', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '200px' }}>
            <img src={report.photo_data || report.photo_url} alt="Report evidence" style={{ width: '100%', objectFit: 'cover', maxHeight: '200px' }} />
          </div>
        )}

        {/* ML result */}
        {report.ml_label && (
          <div style={{ background: 'var(--green-50)', border: '1px solid var(--green-200)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--green-700)', marginBottom: '6px' }}>AI Classification</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green-800)' }}>{report.ml_label.replace(/_/g, ' ')}</span>
              <span style={{ fontSize: '13px', color: 'var(--green-700)' }}>{Math.round((report.ml_confidence || 0) * 100)}% confidence</span>
              {report.ml_severity && (
                <span style={{ fontSize: '12px', fontWeight: 600, color: SEV_COLORS[report.ml_severity] || '#555', textTransform: 'capitalize' }}>
                  {report.ml_severity} severity
                </span>
              )}
            </div>
          </div>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontWeight: 600, minWidth: '100px', color: 'var(--text-tertiary)' }}>Location</span>
            <span>{report.latitude?.toFixed(5)}°, {report.longitude?.toFixed(5)}°</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontWeight: 600, minWidth: '100px', color: 'var(--text-tertiary)' }}>Reported</span>
            <span>{new Date(report.created_at).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontWeight: 600, minWidth: '100px', color: 'var(--text-tertiary)' }}>Reporter</span>
            <span>{report.reporter_name || 'Anonymous'}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontWeight: 600, minWidth: '100px', color: 'var(--text-tertiary)' }}>Verifications</span>
            <span>{report.verification_count || 0} / 3 needed</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {canVerify && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleVerify}
              disabled={verifying}
              style={{ flex: 1 }}
            >
              {verifying ? 'Verifying…' : '✓ Verify Report (+5 pts)'}
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleShare} style={{ flex: 1 }}>
            Share
          </button>
        </div>

        {!currentUser && (
          <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            <a href="/login" style={{ color: 'var(--green-600)' }}>Sign in</a> to verify this report and earn points.
          </p>
        )}
      </div>
    </div>
  );
};

export default ReportDetailDialog;
