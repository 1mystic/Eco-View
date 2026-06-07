import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import '../styles/ecoview.css';

const EcoViewLogo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <path d="M16 2L28.124 9V23L16 30L3.876 23V9L16 2Z" fill="#a8cc38" fillOpacity="0.15" stroke="#a8cc38" strokeWidth="1.5" />
    <path d="M16 8C12.686 8 10 10.686 10 14c0 3.314 2.686 6 6 6s6-2.686 6-6c0-3.314-2.686-6-6-6z" fill="#a8cc38" fillOpacity="0.35" />
    <path d="M16 11c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" fill="#a8cc38" />
    <path d="M16 17v7" stroke="#a8cc38" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="7" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
    <path d="M6 7V5a2 2 0 012-2h0a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.3" />
    <rect x="7" y="10" width="2" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
    <path d="M5 10v.01M11 10v.01M5 13v.01M11 13v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
    <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M5.3 2H3a1 1 0 00-1 1v1.5C2 10.5 5.5 14 11.5 14H13a1 1 0 001-1v-2.3a1 1 0 00-.7-1l-2-.5a1 1 0 00-1.1.5l-.6 1.1a7.5 7.5 0 01-3.4-3.4l1.1-.6a1 1 0 00.5-1.1L7.3 3a1 1 0 00-1-.7H5.3z" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="8" cy="11" r="1" fill="currentColor" />
  </svg>
);
const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M8 7v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="5" r="0.75" fill="currentColor" />
  </svg>
);
const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 10V3M5 6l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
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
const Spinner = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'spin 0.8s linear infinite', verticalAlign: 'middle' }}>
    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" opacity="0.5" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const TWO_COL = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 20px' };

const NGORegister = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [description, setDescription] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [document, setDocument] = useState(null);
  const fileInputRef = useRef(null);

  const EMPTY_ERR = { orgName: '', contactName: '', email: '', phone: '', password: '', confirmPassword: '', regNumber: '', document: '' };
  const [errors, setErrors] = useState(EMPTY_ERR);

  const validateForm = () => {
    const e = { ...EMPTY_ERR };
    let valid = true;
    if (!orgName)                                          { e.orgName = 'Organization name is required'; valid = false; }
    if (!contactName)                                      { e.contactName = 'Contact person name is required'; valid = false; }
    if (!email)                                            { e.email = 'Email is required'; valid = false; }
    else if (!/\S+@\S+\.\S+/.test(email))                 { e.email = 'Email is invalid'; valid = false; }
    if (!phone)                                            { e.phone = 'Phone number is required'; valid = false; }
    else if (!/^\d{10}$/.test(phone.replace(/[^0-9]/g, ''))) { e.phone = 'Enter a valid 10-digit phone number'; valid = false; }
    if (!regNumber)                                        { e.regNumber = 'Registration number is required'; valid = false; }
    if (!document)                                         { e.document = 'Please upload your NGO registration certificate'; valid = false; }
    if (!password)                                         { e.password = 'Password is required'; valid = false; }
    else if (password.length < 6)                          { e.password = 'Password must be at least 6 characters'; valid = false; }
    if (!confirmPassword)                                  { e.confirmPassword = 'Please confirm your password'; valid = false; }
    else if (confirmPassword !== password)                 { e.confirmPassword = "Passwords don't match"; valid = false; }
    setErrors(e);
    return valid;
  };

  const uploadDocument = async () => {
    if (!document) return null;
    const formData = new FormData();
    formData.append('file', document);
    formData.append('upload_preset', 'ecoview-preset');
    formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      return data.secure_url || null;
    } catch {
      toast.error('Failed to upload document.');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (document.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, document: 'File size should not exceed 5 MB' }));
      return;
    }
    setIsSubmitting(true);

    let authUser;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      authUser = cred.user;
    } catch (err) {
      const msg = {
        'auth/email-already-in-use':    'This email is already registered. Try signing in instead.',
        'auth/operation-not-allowed':   'Email sign-up is currently disabled.',
        'auth/weak-password':           'Password is too weak — use at least 6 characters.',
        'auth/invalid-email':           'Invalid email address format.',
        'auth/network-request-failed':  'Network error. Check your connection and try again.',
      }[err.code] || `Registration failed (${err.code || 'unknown'}). Please try again.`;
      toast.error(msg);
      setIsSubmitting(false);
      return;
    }

    const uploadedUrl = await uploadDocument();

    try {
      await setDoc(doc(db, 'users', authUser.uid), {
        uid: authUser.uid, name: orgName, email, role: 'ngo',
        description, regNum: regNumber, contactPerson: contactName, contactNo: phone,
        createdAt: serverTimestamp(), approvalStatus: 'pending',
        docProofURL: uploadedUrl || '', points: 0,
      });
    } catch { /* Firestore rules may not be deployed yet */ }

    setOrgName(''); setContactName(''); setEmail(''); setPhone('');
    setPassword(''); setConfirmPassword(''); setDescription(''); setRegNumber('');
    setDocument(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setIsSubmitting(false);
    setSuccessOpen(true);
  };

  return (
    <div className="auth-page" style={{ minHeight: '100vh', paddingTop: '40px', paddingBottom: '60px' }}>
      <Link to="/" className="auth-brand">
        <EcoViewLogo />
        EcoView
      </Link>

      <div className="auth-card auth-card--wide" style={{ maxWidth: '720px' }}>
        <div className="auth-card__top">
          <h1>Register your Organization</h1>
          <p>Join EcoView to lead environmental campaigns and take action</p>
        </div>

        <div className="auth-card__body">
          <form onSubmit={handleSubmit} noValidate>

            <div style={TWO_COL}>
              {/* Org Name */}
              <div className="auth-field">
                <label htmlFor="orgName" className="auth-label">Organization Name*</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><BuildingIcon /></span>
                  <input id="orgName" type="text" className="auth-input" placeholder="Your Organization" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                </div>
                {errors.orgName && <p className="auth-error">{errors.orgName}</p>}
              </div>

              {/* Contact Person */}
              <div className="auth-field">
                <label htmlFor="contactName" className="auth-label">Contact Person*</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><UserIcon /></span>
                  <input id="contactName" type="text" className="auth-input" placeholder="Full Name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                </div>
                {errors.contactName && <p className="auth-error">{errors.contactName}</p>}
              </div>

              {/* Email */}
              <div className="auth-field">
                <label htmlFor="email" className="auth-label">Email Address*</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><MailIcon /></span>
                  <input id="email" type="email" className="auth-input" placeholder="contact@org.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {errors.email && <p className="auth-error">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="auth-field">
                <label htmlFor="phone" className="auth-label">Phone Number*</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><PhoneIcon /></span>
                  <input id="phone" type="tel" pattern="\d{10}" maxLength={10} className="auth-input" placeholder="10-digit number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                {errors.phone && <p className="auth-error">{errors.phone}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="auth-field">
              <label htmlFor="description" className="auth-label">Organization Description</label>
              <textarea
                id="description"
                className="auth-input"
                placeholder="Brief description of your organization's mission and activities"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical', paddingLeft: '16px', minHeight: '80px' }}
              />
            </div>

            <div style={TWO_COL}>
              {/* Reg Number */}
              <div className="auth-field">
                <label htmlFor="regNumber" className="auth-label">NGO Registration Number*</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><InfoIcon /></span>
                  <input id="regNumber" type="text" className="auth-input" placeholder="Official registration ID" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} />
                </div>
                {errors.regNumber && <p className="auth-error">{errors.regNumber}</p>}
              </div>

              {/* Document upload */}
              <div className="auth-field">
                <label className="auth-label">Registration Certificate*</label>
                <label
                  htmlFor="document"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px', border: '1.5px dashed var(--border)', borderRadius: '8px',
                    background: 'var(--surface-secondary)', cursor: 'pointer',
                    fontSize: '14px', color: document ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    transition: 'border-color 0.15s', overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--green-400)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <span style={{ flexShrink: 0, color: 'var(--text-tertiary)' }}><UploadIcon /></span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {document ? document.name : 'Upload certificate (PDF, JPG, PNG)'}
                  </span>
                </label>
                <input id="document" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} ref={fileInputRef} onChange={(e) => setDocument(e.target.files[0])} />
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Max 5 MB</p>
                {errors.document && <p className="auth-error">{errors.document}</p>}
              </div>
            </div>

            <div style={TWO_COL}>
              {/* Password */}
              <div className="auth-field">
                <label htmlFor="password" className="auth-label">Password*</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><LockIcon /></span>
                  <input id="password" type={showPassword ? 'text' : 'password'} className="auth-input" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                  <button type="button" className="auth-input-toggle" onClick={() => setShowPassword((s) => !s)}>
                    <EyeIcon off={showPassword} />
                  </button>
                </div>
                {errors.password && <p className="auth-error">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="auth-field">
                <label htmlFor="confirmPassword" className="auth-label">Confirm Password*</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><LockIcon /></span>
                  <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} className="auth-input" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                  <button type="button" className="auth-input-toggle" onClick={() => setShowConfirmPassword((s) => !s)}>
                    <EyeIcon off={showConfirmPassword} />
                  </button>
                </div>
                {errors.confirmPassword && <p className="auth-error">{errors.confirmPassword}</p>}
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? <><Spinner />&nbsp; Submitting Application…</> : 'Submit Application'}
            </button>
          </form>
        </div>

        <div className="auth-card__footer">
          Already have an account? <Link to="/login">Sign in</Link>
          <span style={{ margin: '0 8px', color: 'var(--border)' }}>·</span>
          <Link to="/register">Register as Individual</Link>
        </div>
      </div>

      {/* Success overlay */}
      {successOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}
        >
          <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '40px 32px', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--green-50)', border: '2px solid var(--green-200)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M5 14l6 6L23 8" stroke="var(--green-500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Application Submitted!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
              Your NGO registration has been submitted. Our team will review your application and verification documents.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '28px' }}>
              You'll receive an email notification once your application is approved.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>
              Return to Login
            </Link>
          </div>
        </div>
      )}

      <MobileBottomNav />
      <Footer />
    </div>
  );
};

export default NGORegister;
