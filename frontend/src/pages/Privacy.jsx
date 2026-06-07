import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import '../styles/ecoview.css';

const sections = [
  {
    title: '1. Information We Collect',
    body: 'EcoView collects information you provide directly — including your name, email address, and location data when you submit incident reports. If you create an account, we store your profile data in Firebase Firestore. Incident photos are stored as base64-encoded data in Firestore documents. We do not sell your personal information to third parties.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use your information to operate the EcoView platform, display incident reports on the map, classify submissions using our ML model (hosted on HuggingFace Spaces), and send you status updates about your reports. Analytics data is used in aggregate to improve platform performance.',
  },
  {
    title: '3. Data Storage and Security',
    body: 'All user data is stored in Google Firebase (Firestore and Authentication). Firebase enforces encryption in transit (TLS) and at rest. Incident images are stored as base64 data within Firestore documents. We do not use third-party image hosting services for user-submitted photos.',
  },
  {
    title: '4. Location Data',
    body: 'Location access is requested when you submit an incident report to automatically capture GPS coordinates. This data is stored with the report and displayed on the public map. You may enter a location manually instead. We do not continuously track your location.',
  },
  {
    title: '5. Cookies and Analytics',
    body: 'EcoView uses minimal browser storage (localStorage) for session management. We do not use advertising cookies or third-party tracking pixels. Firebase may collect anonymous usage analytics to help improve service reliability.',
  },
  {
    title: '6. Third-Party Services',
    body: 'EcoView integrates with Google Firebase (Auth, Firestore), HuggingFace Spaces (ML inference), and Cloudinary (NGO document uploads). Each service operates under its own privacy policy. We share data with these services only to the extent necessary for platform operation.',
  },
  {
    title: '7. Your Rights',
    body: 'You may request deletion of your account and associated data at any time by contacting support@ecoview.app. Anonymous reports submitted without an account cannot be individually attributed or deleted. Incident reports marked "Verified" may be retained for public record purposes.',
  },
  {
    title: '8. Contact',
    body: 'For privacy-related queries, contact us at support@ecoview.app. We aim to respond within 5 business days.',
  },
];

const Privacy = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="app-page">
      <NavBar />
      <main className="app-page__main">
        <div className="container" style={{ maxWidth: '760px', padding: '56px 24px 80px' }}>

          <span className="badge badge--green" style={{ marginBottom: '20px', display: 'inline-flex' }}>Legal</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', lineHeight: 1.2 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '48px' }}>
            Last updated: June 2026
          </p>

          <div className="card" style={{ padding: '16px 20px', background: 'var(--green-50)', border: '1px solid var(--green-200)', marginBottom: '40px' }}>
            <p style={{ fontSize: '14px', color: 'var(--green-800)', lineHeight: 1.65 }}>
              EcoView is an open-source community platform. We collect only the data necessary to operate the service and never sell your information.
            </p>
          </div>

          {sections.map(({ title, body }) => (
            <div key={title} style={{ marginBottom: '36px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                {title}
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>{body}</p>
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '32px', marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/terms" className="btn btn-secondary btn-sm">Terms of Service</Link>
            <Link to="/" className="btn btn-outline btn-sm">Back to Home</Link>
          </div>
        </div>
      </main>
      <MobileBottomNav />
      <Footer />
    </div>
  );
};

export default Privacy;
