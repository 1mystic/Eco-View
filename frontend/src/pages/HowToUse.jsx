import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
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

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const HowToUse = () => {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.animate-in').forEach((el) => observer.observe(el));

    return () => { window.removeEventListener('scroll', handleScroll); observer.disconnect(); };
  }, []);

  const steps = [
    {
      num: '01',
      title: 'Report',
      desc: 'Open the Report page from the nav or the main map. Describe what you observed — pollution type, location, and a brief description. GPS coordinates are captured automatically.',
      detail: 'Works on any browser. No app installation required. Anonymous reports are accepted.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <path d="M13 3C9.134 3 6 6.134 6 10c0 5 7 14 7 14s7-9 7-14c0-3.866-3.134-7-7-7z" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="13" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Upload a Photo',
      desc: 'Attach a photo of the incident. Clear, well-lit images in daylight produce the most accurate classifications. Multiple photos per report are supported.',
      detail: 'JPEG, PNG, or HEIC. Max 10MB. The image is uploaded to secure cloud storage and never shared publicly without your consent.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <rect x="3" y="5" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="10" r="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3 16l5-5 4 4 3-3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      num: '03',
      title: 'ML Classifies',
      desc: 'Our YOLOv8 model analyses your image in under 2 seconds — detecting hazard type, estimating severity, and generating a confidence score. No manual tagging needed.',
      detail: 'Current categories: garbage dumps, plastic waste, industrial smoke, water contamination, deforestation, and 9 others.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <rect x="3" y="3" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 13l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      num: '04',
      title: 'View Results',
      desc: 'Verified incidents appear on the live map within seconds. Track the status of your report in your dashboard — from Pending → Verified → Resolved.',
      detail: 'Organisations subscribed to your area receive real-time alerts. Export your report history as CSV or GeoJSON at any time.',
      icon: (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <path d="M6 20l4-10 4 6 3-4 3 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  const tips = [
    {
      title: 'Shoot in daylight',
      desc: 'Natural light dramatically improves object detection confidence — especially for subtle hazards like contaminated water or airborne particles.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: 'Enable location access',
      desc: 'GPS coordinates are the most critical data point for geospatial analysis. Allow location access when prompted — it takes one tap.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2C7.239 2 5 4.239 5 7c0 3.75 5 10 5 10s5-6.25 5-10c0-2.761-2.239-5-5-5z" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      title: 'Be specific in descriptions',
      desc: 'Include scale references ("pile the size of a car"), duration ("ongoing for 3 weeks"), and any known sources ("factory upstream").',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 6h12M4 10h8M4 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: 'Report frequently',
      desc: 'Repeated reports from the same area over time create time-series data that exposes chronic pollution — the hardest to address and the most damaging.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 10c0-3.866 3.134-7 7-7s7 3.134 7 7-3.134 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M3 13V10H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: 'Verify others\' reports',
      desc: 'Three independent verifications elevate a report to "Verified" status. If you spot a confirmed incident on the map, confirm it — your signal matters.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
        </svg>
      ),
    },
    {
      title: 'Track your impact',
      desc: 'Your dashboard shows how many of your reports have been verified, escalated to NGOs, and resolved. Earn contribution credits on the leaderboard.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 15l4-5 4 3 3-5 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  const faqItems = [
    {
      q: 'Do I need an account to submit a report?',
      a: 'No. Anonymous reporting is supported for all incident types. Creating a free account unlocks report tracking in your dashboard, personalised area alerts, and contribution credits on the leaderboard.',
    },
    {
      q: 'How long does ML classification take?',
      a: 'Under 2 seconds for standard images. Our YOLOv8 inference pipeline runs on the FastAPI backend and is optimised with ONNX. If the backend is under load, classification may take up to 10 seconds — you\'ll see a live status indicator.',
    },
    {
      q: 'What happens after I submit a report?',
      a: 'Your report enters "Pending" status. The ML model classifies it immediately. If confidence is high (>85%), it is auto-promoted to "Classified." Community verifications or admin review upgrade it to "Verified." Relevant NGOs and government subscribers are alerted at the Verified stage.',
    },
    {
      q: 'Can I submit a report without a photo?',
      a: 'Yes — photos are optional but strongly encouraged. Text-only reports are accepted and placed on the map, but ML classification requires an image. Reports without photos carry a lower confidence weight in geospatial aggregations.',
    },
    {
      q: 'How do I know if my report made a difference?',
      a: 'Your dashboard tracks each report from submission through verification, NGO escalation, and resolution. When a report is marked Resolved, you receive a notification and a summary of what action was taken — if the resolving organisation provides one.',
    },
  ];

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/how-to-use', label: 'How It Works', active: true },
    { to: '/contribute', label: 'Contribute' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Nav */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav__inner">
          <Link to="/" className="nav__logo">
            <EcoViewLogo />
            EcoView
          </Link>
          <ul className="nav__links">
            {navLinks.map(({ to, label, active }) => (
              <li key={label}>
                <Link to={to} className={`nav__link${active ? ' active' : ''}`}>{label}</Link>
              </li>
            ))}
          </ul>
          <div className="nav__actions">
            <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/report" className="btn btn-primary btn-sm">Report Incident</Link>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section className="hero section">
          <div className="container">
            <div style={{ maxWidth: '640px' }} className="animate-in">
              <span className="badge badge--green">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <circle cx="4" cy="4" r="3" fill="currentColor" />
                </svg>
                How It Works
              </span>
              <h1 className="display-xl hero__title">
                From Photo to{' '}
                <span style={{ color: 'var(--green-500)' }}>Verified Incident</span>{' '}
                in Four Steps
              </h1>
              <p className="body-lg hero__desc">
                No training required. No technical knowledge needed. Point your camera, describe what you see — EcoView's ML pipeline does the rest.
              </p>
              <div className="hero__actions">
                <Link to="/report" className="btn btn-primary btn-lg">Report Now</Link>
                <Link to="/map-view" className="btn btn-secondary btn-lg">Explore the Map</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="section section--alt" id="steps">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }} className="animate-in">
              <p className="section-subtitle" style={{ margin: 0 }}>The Process</p>
              <h2 className="display-lg" style={{ marginTop: '12px' }}>Step-by-Step Guide</h2>
            </div>

            <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {steps.map(({ num, title, desc, detail, icon }, i) => (
                <div
                  key={num}
                  className="card"
                  style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: '24px', alignItems: 'start', padding: '32px' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div className="icon-circle icon-circle--lg">{icon}</div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, color: 'var(--green-500)', letterSpacing: '0.06em' }}>{num}</span>
                  </div>
                  <div>
                    <h3 className="heading-lg">{title}</h3>
                    <p className="body-md" style={{ marginTop: '8px' }}>{desc}</p>
                    <p className="body-sm" style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--green-50)', border: '1px solid var(--green-200)', borderRadius: 'var(--radius-sm)' }}>
                      {detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="section">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '0' }} className="animate-in">
              <p className="section-subtitle" style={{ margin: 0 }}>Best Practices</p>
              <h2 className="display-lg" style={{ marginTop: '12px' }}>Tips for Better Reports</h2>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginTop: '16px', maxWidth: '520px', margin: '16px auto 0', lineHeight: 1.65 }}>
                Higher-quality submissions produce more accurate classifications and faster NGO responses.
              </p>
            </div>

            <div className="tips-grid animate-in">
              {tips.map(({ title, desc, icon }) => (
                <div className="tip-item" key={title}>
                  <div className="icon-circle icon-circle--sm">{icon}</div>
                  <div className="tip-item__text">
                    <h4>{title}</h4>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section section--alt" id="faq">
          <div className="container">
            <div style={{ textAlign: 'center' }} className="animate-in">
              <p className="section-subtitle" style={{ margin: 0 }}>FAQ</p>
              <h2 className="display-lg" style={{ marginTop: '12px' }}>Common Questions</h2>
            </div>

            <div className="faq-list animate-in">
              {faqItems.map(({ q, a }, i) => (
                <div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
                  <button
                    className="faq-item__q"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    {q}
                    <PlusIcon />
                  </button>
                  <div className="faq-item__a">
                    <p>{a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section">
          <div className="container">
            <div className="cta-section animate-in">
              <p className="section-subtitle" style={{ margin: 0 }}>Get Started</p>
              <h2 className="display-lg">Ready to Make a Difference?</h2>
              <p className="body-lg" style={{ maxWidth: '480px' }}>
                Your first report takes under 60 seconds. No account required. Every submission helps build the environmental intelligence layer that communities depend on.
              </p>
              <div className="cta-actions">
                <Link to="/report" className="btn btn-primary btn-lg">Report an Incident</Link>
                <Link to="/map-view" className="btn btn-outline btn-lg">Explore the Map</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowToUse;
