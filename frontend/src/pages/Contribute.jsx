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

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Contribute = () => {
  const [scrolled, setScrolled] = useState(false);

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

  const ways = [
    {
      label: 'Citizens',
      title: 'Report Incidents',
      desc: 'The most impactful contribution is observation. Every photo report you submit feeds real data into the ML pipeline and helps communities hold polluters accountable.',
      features: [
        'Submit geo-tagged incident reports with photos',
        'Works anonymously — no account required',
        'Takes under 60 seconds per report',
        'Track your impact via the leaderboard',
      ],
      cta: { label: 'Report an Incident', to: '/report', primary: true },
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6z" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ),
    },
    {
      label: 'Validators',
      title: 'Verify Reports',
      desc: 'Community verification is the trust backbone of EcoView. Three independent verifications elevate a report to "Verified" status, triggering NGO alerts and policy escalations.',
      features: [
        'Browse unverified reports near your area',
        'Confirm or flag reports in one click',
        'Your verifications carry weighted trust score',
        'Earn validation credits on the leaderboard',
      ],
      cta: { label: 'Explore the Map', to: '/map-view', primary: false },
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7 12l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: 'Developers',
      title: 'Build & Improve',
      desc: 'EcoView is open source. Whether you\'re fixing a bug, improving the inference pipeline, or building an integration — every PR directly improves the platform millions depend on.',
      features: [
        'React 19 + Vite frontend (TypeScript welcome)',
        'FastAPI Python backend (Phase 3)',
        'YOLOv8 training pipeline on Kaggle (Phase 5)',
        'Good first issues labelled in every milestone',
      ],
      cta: { label: 'View on GitHub', to: '#', primary: false },
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8l-5-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 3v5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: 'Researchers',
      title: 'Contribute Data',
      desc: 'Environmental researchers can contribute annotated datasets, model benchmarks, and domain expertise that sharpens our hazard taxonomy and improves classification for niche pollution types.',
      features: [
        'Academic licensing: free access to the full dataset API',
        'Co-author model evaluation papers with the EcoView team',
        'Submit labelled datasets via DVC-compatible pipeline',
        'Benchmark your models against EcoView\'s YOLOv8 baseline',
      ],
      cta: { label: 'Contact Us', to: '#', primary: false },
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  const stats = [
    { value: '140K', label: 'Active reporters' },
    { value: '2.4M', label: 'Reports submitted' },
    { value: '28', label: 'States covered' },
    { value: '98%', label: 'Verification accuracy' },
  ];

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/how-to-use', label: 'How It Works' },
    { to: '/contribute', label: 'Contribute', active: true },
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
            <div style={{ maxWidth: '680px' }} className="animate-in">
              <span className="badge badge--green">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <circle cx="4" cy="4" r="3" fill="currentColor" />
                </svg>
                Open Platform
              </span>
              <h1 className="display-xl hero__title">
                Every Contribution{' '}
                <span style={{ color: 'var(--green-500)' }}>Moves the Needle</span>
              </h1>
              <p className="body-lg hero__desc">
                EcoView works because thousands of people contribute in different ways. Whether you report incidents, verify data, write code, or share research — you're building the environmental intelligence layer the planet needs.
              </p>
              <div className="hero__actions">
                <Link to="/report" className="btn btn-primary btn-lg">Start Reporting</Link>
                <a href="#ways" className="btn btn-secondary btn-lg">See All Ways</a>
              </div>
            </div>
          </div>
        </section>

        {/* Community stats strip */}
        <div className="section--alt">
          <div className="container">
            <div className="trust-bar">
              {stats.map(({ value, label }) => (
                <div className="trust-item" key={label} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ways to contribute */}
        <section className="section" id="ways">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '0' }} className="animate-in">
              <p className="section-subtitle" style={{ margin: 0 }}>Contribution Modes</p>
              <h2 className="display-lg" style={{ marginTop: '12px' }}>Four Ways to Make an Impact</h2>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginTop: '16px', maxWidth: '520px', margin: '16px auto 0', lineHeight: 1.65 }}>
                Pick the role that fits your skills and time. Every mode compounds on the others.
              </p>
            </div>

            <div className="ways-grid animate-in">
              {ways.map(({ label, title, desc, features, cta, icon }) => (
                <div className="way-card" key={label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="icon-circle">{icon}</div>
                    <span className="way-card__label">{label}</span>
                  </div>
                  <h3 className="heading-lg">{title}</h3>
                  <p className="body-md">{desc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    {features.map((f) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div className="icon-circle icon-circle--sm" style={{ flexShrink: 0, marginTop: '1px' }}>
                          <CheckIcon />
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                    <Link
                      to={cta.to}
                      className={`btn btn-sm ${cta.primary ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {cta.label}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GitHub CTA */}
        <section className="section section--alt">
          <div className="container animate-in">
            <div className="github-cta">
              <div className="github-cta__text">
                <h2>EcoView is Open Source</h2>
                <p>The full codebase — frontend, backend, ML pipeline, and training notebooks — is publicly available. Star the repo, open an issue, or submit a PR.</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'React + Vite', color: 'var(--green-400)' },
                    { label: 'FastAPI', color: 'var(--green-400)' },
                    { label: 'YOLOv8', color: 'var(--green-400)' },
                    { label: 'Python', color: 'var(--green-400)' },
                    { label: 'PostgreSQL', color: 'var(--green-400)' },
                  ].map(({ label }) => (
                    <span key={label} className="badge badge--green">{label}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
                <a href="#" className="btn btn-primary btn-lg" style={{ justifyContent: 'center', minWidth: '180px' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 1C4.58 1 1 4.58 1 9c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.35c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.81.06 1.24.83 1.24.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.58.83-2.14-.08-.2-.36-1.01.08-2.11 0 0 .67-.22 2.2.82A7.6 7.6 0 019 5.33c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.52.56.83 1.27.83 2.14 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38C14.71 15.53 17 12.54 17 9c0-4.42-3.58-8-8-8z" fill="currentColor" />
                  </svg>
                  View on GitHub
                </a>
                <a href="#" className="btn btn-outline btn-lg" style={{ justifyContent: 'center', color: 'var(--gray-300)', borderColor: 'var(--gray-700)' }}>
                  Read the Docs
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section">
          <div className="container">
            <div className="cta-section animate-in">
              <p className="section-subtitle" style={{ margin: 0 }}>Get Started Today</p>
              <h2 className="display-lg">Your First Contribution Takes 60 Seconds</h2>
              <p className="body-lg" style={{ maxWidth: '500px' }}>
                Open the report page, describe what you see, and submit. No account required. Your observation becomes verified environmental intelligence.
              </p>
              <div className="cta-actions">
                <Link to="/report" className="btn btn-primary btn-lg">Report Your First Incident</Link>
                <Link to="/map-view" className="btn btn-outline btn-lg">Explore Live Map</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contribute;
