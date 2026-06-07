import { useNavigate } from 'react-router';
import '../styles/ecoview.css';

const UserIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="4" y="12" width="24" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 12V8a2 2 0 012-2h4a2 2 0 012 2v4" stroke="currentColor" strokeWidth="1.8" />
    <rect x="14" y="20" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 18v.01M22 18v.01M10 23v.01M22 23v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function RegisterTypeDialog({ isOpen, onOpenChange }) {
  const navigate = useNavigate();

  const choose = (type) => {
    onOpenChange(false);
    navigate(type === 'user' ? '/register' : '/ngo-register');
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        className="card"
        style={{ maxWidth: '480px', width: '100%', padding: '32px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700,
            color: 'var(--text-primary)', marginBottom: '8px',
          }}>
            Join EcoView
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Choose how you want to contribute to a cleaner environment
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { type: 'user', label: 'Individual',         desc: 'Report incidents & earn points',   Icon: UserIcon },
            { type: 'ngo',  label: 'Organization / NGO', desc: 'Manage campaigns & take action',   Icon: BuildingIcon },
          ].map(({ type, label, desc, Icon }) => (
            <button
              key={type}
              onClick={() => choose(type)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                padding: '24px 16px', border: '1.5px solid var(--border)', borderRadius: '12px',
                background: 'var(--surface)', cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--green-400)';
                e.currentTarget.style.background = 'var(--surface-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--surface)';
              }}
            >
              <div style={{ color: 'var(--green-500)' }}><Icon /></div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RegisterTypeDialog;
