import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import '../styles/ecoview.css';

const EcoViewLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2L28.124 9V23L16 30L3.876 23V9L16 2Z" fill="#a8cc38" fillOpacity="0.15" stroke="#a8cc38" strokeWidth="1.5" />
    <path d="M16 8C12.686 8 10 10.686 10 14C10 17.314 12.686 20 16 20C19.314 20 22 17.314 22 14C22 10.686 19.314 8 16 8Z" fill="#a8cc38" fillOpacity="0.35" />
    <path d="M16 11C14.343 11 13 12.343 13 14C13 15.657 14.343 17 16 17C17.657 17 19 15.657 19 14C19 12.343 17.657 11 16 11Z" fill="#a8cc38" />
    <path d="M16 17V24" stroke="#a8cc38" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M13 20.5H19" stroke="#a8cc38" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const Spinner = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" opacity="0.5" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="8" cy="11" r="1" fill="currentColor" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
    <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const EyeIcon = ({ off }) => off ? (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
  </svg>
);

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = { name: '', email: '', password: '', confirmPassword: '' };
    let ok = true;
    if (!form.name || form.name.length < 2) { e.name = 'Name must be at least 2 characters'; ok = false; }
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) { e.email = 'Valid email is required'; ok = false; }
    if (!form.password || form.password.length < 6) { e.password = 'Password must be at least 6 characters'; ok = false; }
    if (form.confirmPassword !== form.password) { e.confirmPassword = 'Passwords do not match'; ok = false; }
    setErrors(e);
    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    // ── Step 1: Firebase Auth ─────────────────────────────────────────────────
    let user;
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      user = cred.user;
    } catch (err) {
      const msg = {
        'auth/email-already-in-use': 'Email already in use. Try signing in instead.',
        'auth/operation-not-allowed': 'Email sign-up is currently disabled. Please contact support or try again later.',
        'auth/weak-password': 'Password is too weak — use at least 6 characters.',
        'auth/invalid-email': 'Invalid email address format.',
        'auth/network-request-failed': 'Network error. Check your connection and try again.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment before trying again.',
      }[err.code] || `Registration failed (${err.code || 'unknown error'}). Try again.`;
      setErrors((prev) => ({ ...prev, email: msg }));
      setIsSubmitting(false);
      return;
    }

    // ── Step 2: Create Firestore profile (best-effort — never blocks navigation) ─
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: form.name,
        email: form.email,
        role: 'user',
        points: 0,
        approvalStatus: null,
        createdAt: new Date(),
      });
    } catch {
      // Firestore rules may not be deployed yet — profile created silently on first dashboard load
    }

    setIsSubmitting(false);
    navigate(`/user-dashboard/${user.uid}`);
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-brand">
        <EcoViewLogo />
        EcoView
      </Link>

      <div className="auth-card auth-card--wide animate-in visible">
        <div className="auth-card__top">
          <h1>Create your account</h1>
          <p>Join 140,000 community reporters making an impact</p>
        </div>

        <div className="auth-card__body">
          <form onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="auth-field">
              <label htmlFor="name" className="auth-label">Full name</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><UserIcon /></span>
                <input
                  id="name" type="text" className="auth-input"
                  placeholder="Your full name"
                  value={form.name} onChange={set('name')} autoComplete="name"
                />
              </div>
              {errors.name && <p className="auth-error">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">Email address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><MailIcon /></span>
                <input
                  id="email" type="email" className="auth-input"
                  placeholder="you@example.com"
                  value={form.email} onChange={set('email')} autoComplete="email"
                />
              </div>
              {errors.email && <p className="auth-error">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password" className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><LockIcon /></span>
                <input
                  id="password" type={show.password ? 'text' : 'password'} className="auth-input"
                  placeholder="At least 6 characters"
                  value={form.password} onChange={set('password')} autoComplete="new-password"
                />
                <button type="button" className="auth-input-toggle" onClick={() => setShow((s) => ({ ...s, password: !s.password }))}>
                  <EyeIcon off={show.password} />
                </button>
              </div>
              {errors.password && <p className="auth-error">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label htmlFor="confirmPassword" className="auth-label">Confirm password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><LockIcon /></span>
                <input
                  id="confirmPassword" type={show.confirm ? 'text' : 'password'} className="auth-input"
                  placeholder="Re-enter password"
                  value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password"
                />
                <button type="button" className="auth-input-toggle" onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}>
                  <EyeIcon off={show.confirm} />
                </button>
              </div>
              {errors.confirmPassword && <p className="auth-error">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner /> Creating account…</> : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="auth-card__footer">
          Already have an account? <Link to="/login">Sign in</Link>
          <span style={{ margin: '0 8px', color: 'var(--border)' }}>·</span>
          <Link to="/ngo-register">Register as NGO</Link>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
        By creating an account you agree to our{' '}
        <Link to="/terms" style={{ color: 'var(--green-600)' }}>Terms</Link>
        {' '}and{' '}
        <Link to="/privacy" style={{ color: 'var(--green-600)' }}>Privacy Policy</Link>.
      </p>
    </div>
  );
};

export default Register;
