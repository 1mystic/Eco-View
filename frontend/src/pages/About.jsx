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

const About = () => {
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

  const techStack = [
    { name: 'YOLOv8m', category: 'Detection Model', desc: 'Fine-tuned on 800K+ labelled environmental images across 14 hazard categories with 98% classification accuracy.' },
    { name: 'FastAPI', category: 'Inference Backend', desc: 'Async Python inference server delivering sub-200ms response times with Uvicorn and ONNX optimisation.' },
    { name: 'React 19 + Vite', category: 'Frontend', desc: 'SPA with Leaflet geospatial mapping, real-time incident feeds, and responsive design.' },
    { name: 'Supabase', category: 'Database', desc: 'PostgreSQL + PostGIS for geospatial queries, row-level security, and structured incident storage.' },
    { name: 'Cloudflare R2', category: 'Object Storage', desc: 'S3-compatible storage for community-submitted images, model weights, and versioned datasets.' },
    { name: 'Evidently AI', category: 'ML Monitoring', desc: 'Automated statistical drift detection across input features and model outputs — triggering retraining alerts.' },
  ];

  const values = [
    {
      title: 'Radical Transparency',
      desc: 'Every classification is confidence-scored, attributed, and auditable. We show our work — from dataset provenance to model performance metrics.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
          <path d="M11 2v2M11 18v2M2 11h2M18 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      ),
    },
    {
      title: 'Community First',
      desc: 'Field reporters are the backbone of EcoView. Every design decision prioritises their workflow — offline-capable, low-bandwidth, intuitive on any device.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="7.5" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="15" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M2 19c0-3.314 2.462-6 5.5-6M11 19c0-3.314 2.686-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: 'Scientific Rigour',
      desc: 'YOLOv8 detection, calibrated confidence scores, active-learning loops, and continuous drift monitoring — we treat ML as engineering, not magic.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M8 2v6l-5 9h16L14 8V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 2h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="9" cy="15" r="1" fill="currentColor" opacity="0.5" />
          <circle cx="13" cy="17" r="1" fill="currentColor" opacity="0.5" />
        </svg>
      ),
    },
    {
      title: 'Open by Default',
      desc: 'Our training datasets, model benchmarks, and API specs are public. Environmental intelligence compounds faster when knowledge is shared, not siloed.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="11" width="16" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 11V7a4 4 0 018 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="11" cy="15.5" r="1.5" fill="currentColor" opacity="0.6" />
        </svg>
      ),
    },
  ];

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About', active: true },
    { to: '/how-to-use', label: 'How It Works' },
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
            <div style={{ maxWidth: '720px' }} className="animate-in">
              <span className="badge badge--green">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <circle cx="4" cy="4" r="3" fill="currentColor" />
                </svg>
                About EcoView
              </span>
              <h1 className="display-xl hero__title">
                Turning Environmental Chaos Into{' '}
                <span style={{ color: 'var(--green-500)' }}>Coordinated Action</span>
              </h1>
              <p className="body-lg hero__desc">
                EcoView is a production-grade environmental hazard intelligence platform — fusing crowdsourced field reports, satellite imagery, and YOLOv8 computer vision into a single real-time data stream that drives decisions, not just dashboards.
              </p>
              <div className="hero__actions">
                <Link to="/report" className="btn btn-primary btn-lg">Report an Incident</Link>
                <Link to="/how-to-use" className="btn btn-secondary btn-lg">See How It Works</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Mission / Story */}
        <section className="section section--alt">
          <div className="container">
            <div className="about-story animate-in">
              <div>
                <p className="section-subtitle" style={{ margin: 0 }}>Our Story</p>
                <h2 className="display-lg" style={{ marginTop: '12px' }}>
                  Pollution Data Exists. The Problem Is Fragmentation.
                </h2>
                <p className="body-lg" style={{ marginTop: '1.5rem' }}>
                  Government sensor networks cover roughly 12% of India's geography. Satellite imagery refreshes every 6 days. NGO field teams coordinate via spreadsheets. Each data stream is siloed, delayed, or inaccessible to the people who need it most.
                </p>
                <p className="body-md" style={{ marginTop: '1rem' }}>
                  EcoView was built to fuse these fragmented streams into one real-time intelligence layer — powered by community photo reports, YOLOv8 classification, geospatial clustering, and predictive risk modelling.
                </p>
                <p className="body-md" style={{ marginTop: '1rem' }}>
                  Our model processes incident photos in under 2 seconds, assigning a hazard type, severity score, and confidence rating. Every verified correction feeds an active-learning loop that makes the next classification more accurate.
                </p>
              </div>

              <div>
                <div className="about-stat-panel">
                  {[
                    { value: '2.4M', label: 'Incidents classified' },
                    { value: '98%', label: 'ML accuracy' },
                    { value: '140K', label: 'Community reporters' },
                    { value: '12s', label: 'Avg response time' },
                  ].map(({ value, label }) => (
                    <div className="about-stat" key={label}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '8px' }}>
                        {value}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 500 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ marginTop: '16px', background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
                  <p style={{ fontSize: '14px', color: 'var(--green-800)', lineHeight: 1.6 }}>
                    <strong>Open-source infrastructure</strong> — our datasets, training notebooks, and API specs are publicly available. If you're a researcher or developer, you can contribute directly to the model pipeline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="section">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }} className="animate-in">
              <p className="section-subtitle" style={{ margin: 0 }}>Technology</p>
              <h2 className="display-lg" style={{ marginTop: '12px' }}>Production-Grade ML Infrastructure</h2>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginTop: '16px', maxWidth: '540px', margin: '16px auto 0', lineHeight: 1.65 }}>
                Every layer of the stack is chosen for reproducibility, observability, and free-tier cost efficiency.
              </p>
            </div>

            <div className="tech-grid animate-in">
              {techStack.map(({ name, category, desc }) => (
                <div className="card cap-card" key={name}>
                  <span className="cap-card__label">{category}</span>
                  <h3 className="heading-lg cap-card__title">{name}</h3>
                  <p className="body-md cap-card__desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="section section--alt">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }} className="animate-in">
              <p className="section-subtitle" style={{ margin: 0 }}>Values</p>
              <h2 className="display-lg" style={{ marginTop: '12px' }}>What We Stand For</h2>
            </div>

            <div className="capabilities-grid animate-in">
              {values.map(({ title, desc, icon }) => (
                <div className="card cap-card" key={title}>
                  <div className="icon-circle">{icon}</div>
                  <h3 className="heading-lg cap-card__title">{title}</h3>
                  <p className="body-md cap-card__desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section">
          <div className="container">
            <div className="cta-section animate-in">
              <p className="section-subtitle" style={{ margin: 0 }}>Get Involved</p>
              <h2 className="display-lg">Join the EcoView Community</h2>
              <p className="body-lg" style={{ maxWidth: '520px' }}>
                Whether you're an NGO, researcher, developer, or concerned citizen — there's a meaningful role for you in the EcoView ecosystem.
              </p>
              <div className="cta-actions">
                <Link to="/report" className="btn btn-primary btn-lg">Report Your First Incident</Link>
                <Link to="/contribute" className="btn btn-outline btn-lg">Ways to Contribute</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
