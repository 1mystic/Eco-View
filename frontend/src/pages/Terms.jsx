import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import '../styles/ecoview.css';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using EcoView, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform. EcoView is an open-source community platform for environmental incident reporting — use is subject to responsible, good-faith contribution.',
  },
  {
    title: '2. User Responsibilities',
    body: 'You agree to submit accurate, good-faith incident reports. Deliberately submitting false reports, spamming the platform, or using EcoView to harass individuals is prohibited. EcoView reserves the right to remove reports and suspend accounts that violate these terms.',
  },
  {
    title: '3. Submitted Content',
    body: 'By submitting an incident report, you grant EcoView a non-exclusive, royalty-free licence to display, store, and process your report (including photos) for the purpose of environmental monitoring. You retain ownership of your submitted content. Reports may be made publicly visible on the map.',
  },
  {
    title: '4. ML Classification Disclaimer',
    body: 'Incident classifications produced by EcoView\'s ML model are automated and may not be accurate. Classifications are provided as informational signals only and should not be used as the sole basis for legal, regulatory, or enforcement decisions. Critical classifications should be independently verified.',
  },
  {
    title: '5. Account Termination',
    body: 'EcoView may suspend or terminate accounts that violate these terms, submit abusive content, or compromise platform integrity. You may delete your account at any time by contacting support@ecoview.app.',
  },
  {
    title: '6. Service Availability',
    body: 'EcoView is provided on a best-effort basis using free-tier infrastructure (Firebase, HuggingFace Spaces, Vercel). We do not guarantee 100% uptime or incident resolution times. The platform may be taken offline for maintenance or updates.',
  },
  {
    title: '7. Limitation of Liability',
    body: 'EcoView is provided "as is" without warranties of any kind. To the fullest extent permitted by law, EcoView and its contributors are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.',
  },
  {
    title: '8. Governing Law',
    body: 'These terms are governed by the laws of India. Any disputes arising from use of EcoView shall be subject to the jurisdiction of courts in India.',
  },
  {
    title: '9. Changes to Terms',
    body: 'We may update these Terms of Service from time to time. Continued use of EcoView after changes constitutes acceptance of the updated terms. The effective date of the latest revision is shown above.',
  },
];

const Terms = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="app-page">
      <NavBar />
      <main className="app-page__main">
        <div className="container" style={{ maxWidth: '760px', padding: '56px 24px 80px' }}>

          <span className="badge badge--green" style={{ marginBottom: '20px', display: 'inline-flex' }}>Legal</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', lineHeight: 1.2 }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '48px' }}>
            Last updated: June 2026
          </p>

          <div className="card" style={{ padding: '16px 20px', background: 'var(--green-50)', border: '1px solid var(--green-200)', marginBottom: '40px' }}>
            <p style={{ fontSize: '14px', color: 'var(--green-800)', lineHeight: 1.65 }}>
              Please read these terms carefully before using EcoView. By using the platform, you agree to these terms in full.
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
            <Link to="/privacy" className="btn btn-secondary btn-sm">Privacy Policy</Link>
            <Link to="/" className="btn btn-outline btn-sm">Back to Home</Link>
          </div>
        </div>
      </main>
      <MobileBottomNav />
      <Footer />
    </div>
  );
};

export default Terms;
