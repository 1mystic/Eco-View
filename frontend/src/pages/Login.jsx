import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validate = () => {
    const e = { email: '', password: '' };
    let ok = true;
    if (!email) { e.email = 'Email is required'; ok = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { e.email = 'Invalid email address'; ok = false; }
    if (!password) { e.password = 'Password is required'; ok = false; }
    else if (password.length < 6) { e.password = 'Password must be at least 6 characters'; ok = false; }
    setErrors(e);
    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    let user;
    // ── Step 1: Firebase Auth ─────────────────────────────────────────────────
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      user = cred.user;
    } catch (err) {
      const msg = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/operation-not-allowed': 'Email sign-in is currently disabled. Please contact support.',
        'auth/network-request-failed': 'Network error. Check your connection and try again.',
        'auth/too-many-requests': 'Too many failed attempts. Please wait before trying again.',
      }[err.code] || `Sign-in failed (${err.code || 'unknown'}). Try again.`;
      setErrors((prev) => ({ ...prev, password: msg }));
      setIsSubmitting(false);
      return;
    }

    // ── Step 2: Firestore role lookup (best-effort — never blocks navigation) ─
    let role = 'user';
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) role = snap.data().role || 'user';
    } catch {
      // Firestore rules may not be set yet — proceed with default role
    }

    setIsSubmitting(false);
    if (role === 'admin') navigate('/admin');
    else if (role === 'ngo') navigate('/ngo-dashboard');
    else navigate(`/user-dashboard/${user.uid}`);
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-brand">
        <EcoViewLogo />
        EcoView
      </Link>

      <div className="auth-card animate-in visible">
        <div className="auth-card__top">
          <h1>Welcome back</h1>
          <p>Sign in to continue to EcoView</p>
        </div>

        <div className="auth-card__body">
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">Email address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="auth-error">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password" className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    <circle cx="8" cy="11" r="1" fill="currentColor" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
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
                  )}
                </button>
              </div>
              {errors.password && <p className="auth-error">{errors.password}</p>}
            </div>

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="auth-card__footer">
          Don't have an account?{' '}
          <Link to="/register">Create one for free</Link>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
        By signing in you agree to our{' '}
        <Link to="/terms" style={{ color: 'var(--green-600)' }}>Terms</Link>
        {' '}and{' '}
        <Link to="/privacy" style={{ color: 'var(--green-600)' }}>Privacy Policy</Link>.
      </p>
    </div>
  );
};

export default Login;
