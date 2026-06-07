import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ecoview.css';

/* ── Logo ──────────────────────────────────────────────────── */
const EcoViewLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 2L28.124 9V23L16 30L3.876 23V9L16 2Z"
      fill="#a8cc38"
      fillOpacity="0.15"
      stroke="#a8cc38"
      strokeWidth="1.5"
    />
    <path
      d="M16 8C12.686 8 10 10.686 10 14C10 17.314 12.686 20 16 20C19.314 20 22 17.314 22 14C22 10.686 19.314 8 16 8Z"
      fill="#a8cc38"
      fillOpacity="0.35"
    />
    <path
      d="M16 11C14.343 11 13 12.343 13 14C13 15.657 14.343 17 16 17C17.657 17 19 15.657 19 14C19 12.343 17.657 11 16 11Z"
      fill="#a8cc38"
    />
    <path d="M16 17V24" stroke="#a8cc38" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M13 20.5H19" stroke="#a8cc38" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
  </svg>
);

/* ── Check icon helper ─────────────────────────────────────── */
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Chevron Down icon ─────────────────────────────────────── */
const ChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Plus icon (FAQ) ───────────────────────────────────────── */
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

/* ── Main Component ────────────────────────────────────────── */
const Home = () => {
  const [scrolled, setScrolled]       = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [openFaq, setOpenFaq]         = useState(null);
  const [activeSol, setActiveSol]     = useState(0);

  /* Scroll handler + IntersectionObserver for animations */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = ['hero', 'how-it-works', 'capabilities', 'solutions', 'features', 'data-sources', 'pricing', 'faq'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    /* IntersectionObserver for .animate-in */
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('.animate-in').forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  /* Solutions tab data */
  const solData = [
    {
      label: 'For NGOs',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8s2.91 6.5 6.5 6.5S14.5 11.59 14.5 8 11.59 1.5 8 1.5z" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 4.5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
      heading: 'Empower Field Operations',
      desc: 'Equip your teams with real-time hazard intelligence to coordinate environmental response faster and more precisely than ever before.',
      features: [
        { title: 'Incident Dashboard', desc: 'Centralised view of all active pollution incidents with severity scoring.' },
        { title: 'Field Reporter App', desc: 'Mobile-first reporting with offline support and automatic geo-tagging.' },
        { title: 'Export & Compliance', desc: 'One-click PDF/CSV export for regulatory submissions and grant reporting.' },
      ],
    },
    {
      label: 'For Communities',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6" cy="5" r="2" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2 13c0-2.21 1.79-4 4-4M9 13c0-2.21 1.79-4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
      heading: 'Local Impact, Global Scale',
      desc: 'Give every resident a voice. Community members can report, verify, and track local hazards through an intuitive interface that requires no technical expertise.',
      features: [
        { title: 'Photo Reporting', desc: 'Snap a photo, add a description — our YOLOv8 model auto-classifies the hazard type.' },
        { title: 'Community Heatmap', desc: 'See pollution patterns in your neighbourhood updated every 30 seconds.' },
        { title: 'Alert Subscriptions', desc: 'Receive push notifications when new hazards are detected near your home.' },
      ],
    },
    {
      label: 'For Government',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1.5" y="7" width="13" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 1.5L14.5 7H1.5L8 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M6 14.5V10h4v4.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ),
      heading: 'Data-Driven Policy',
      desc: 'Transform raw community reports into actionable policy intelligence. EcoView provides agencies with audit-ready datasets and geospatial analytics.',
      features: [
        { title: 'API Integration', desc: 'REST & GraphQL APIs to embed EcoView data into existing GIS and ERP systems.' },
        { title: 'Audit Trails', desc: 'Immutable incident logs with chain-of-custody metadata for legal proceedings.' },
        { title: 'Trend Forecasting', desc: 'Predictive ML models surface seasonal and regional pollution risk patterns.' },
      ],
    },
    {
      label: 'For Researchers',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
      heading: 'Rich Environmental Datasets',
      desc: 'Access the largest crowdsourced pollution dataset in South Asia. Fuel your research with verified, multimodal data that spans years and geographies.',
      features: [
        { title: 'Dataset API', desc: 'Query 2.4M+ classified incidents filtered by type, severity, date, and region.' },
        { title: 'Model Benchmarks', desc: 'Compare your detection models against EcoView\'s YOLOv8 baseline on standardised splits.' },
        { title: 'Academic Licensing', desc: 'Free access for accredited research institutions and open-source projects.' },
      ],
    },
  ];

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  const faqItems = [
    {
      q: 'How does EcoView classify pollution incidents?',
      a: 'EcoView uses a fine-tuned YOLOv8 model trained on over 800,000 labelled environmental images across 14 hazard categories — including water pollution, air quality events, illegal dumping, and deforestation. Submitted photos are processed in under two seconds, and a confidence score is attached to every classification.',
    },
    {
      q: 'Can I report an incident without creating an account?',
      a: 'Yes. Anonymous reporting is supported for all incident types. Creating a free account unlocks historical tracking, personalised alerts, and contribution credits that can be used to request priority analysis for your area.',
    },
    {
      q: 'How accurate is the YOLOv8 detection model?',
      a: 'Our current production model achieves 98% classification accuracy on the held-out validation set, benchmarked against COCO-style mAP metrics. Accuracy is continuously improved through active learning — every verified human correction is fed back into quarterly model retraining cycles.',
    },
    {
      q: 'How does EcoView handle false reports or calibration drift?',
      a: 'Every ML classification is cross-validated against sensor data (where available) and undergoes a community verification step — three independent confirmations elevate a report to "Verified" status. Persistent disagreement flags the incident for expert human review. Calibration drift in sensor integrations is detected automatically via statistical process control alerts.',
    },
    {
      q: 'What data sources feed the EcoView intelligence layer?',
      a: 'EcoView aggregates community photo reports, satellite imagery from Sentinel-2 and Landsat-9, government air quality sensor feeds, IoT water quality buoys, social media signals, and news NLP pipelines. All data streams are timestamped, attributed, and available via API for Organisation and Enterprise subscribers.',
    },
  ];

  return (
    <>
      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`} id="nav">
        <div className="nav__inner">
          <a href="#hero" className="nav__logo">
            <EcoViewLogo />
            EcoView
          </a>

          <ul className="nav__links">
            {[
              { id: 'how-it-works', label: 'How It Works' },
              { id: 'capabilities', label: 'Capabilities' },
              { id: 'solutions',    label: 'Solutions' },
              { id: 'data-sources', label: 'Data Sources' },
              { id: 'pricing',      label: 'Pricing' },
            ].map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={`nav__link${activeSection === id ? ' active' : ''}`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <div className="nav__actions">
            <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="hero section" id="hero">
          <div className="container">
            <div className="hero__grid">
              {/* Left: Content */}
              <div className="hero__content animate-in">
                <div>
                  <span className="badge badge--green">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <circle cx="4" cy="4" r="3" fill="currentColor" />
                    </svg>
                    Environmental Hazard Intelligence
                  </span>
                </div>

                <h1 className="display-xl hero__title">
                  Crowdsourced Precision,{' '}
                  <span style={{ color: 'var(--green-500)' }}>Built to Protect</span>{' '}
                  Our Planet
                </h1>

                <p className="body-lg hero__desc">
                  A multimodal ML platform that detects and classifies pollution incidents in real-time — empowering communities, NGOs, and governments to act with intelligence.
                </p>

                <div className="hero__actions">
                  <Link to="/report" className="btn btn-primary btn-lg">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 2.25v13.5M2.25 9h13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Report an Incident
                  </Link>
                  <Link to="/map-view" className="btn btn-secondary btn-lg">
                    Explore the Map
                  </Link>
                </div>
              </div>

              {/* Right: Dashboard widget mockup */}
              <div className="hero__visual animate-in" style={{ animationDelay: '0.1s' }}>
                <div className="dash-topbar">
                  <div className="dash-topbar__tabs">
                    <span className="dash-topbar__tab active">Live Feed</span>
                    <span className="dash-topbar__tab">Analytics</span>
                    <span className="dash-topbar__tab">Alerts</span>
                  </div>
                  <span className="dash-topbar__status">● LIVE</span>
                </div>

                {/* Mini map */}
                <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                  <div className="dash-map" style={{ height: '100%' }}>
                    <div className="dash-map__contour" style={{ width: '80px', height: '80px', top: '40%', left: '45%', border: '1px dashed rgba(140,180,100,0.3)', borderRadius: '50%', transform: 'translate(-50%,-50%)', position: 'absolute' }} />
                    <div className="dash-map__contour" style={{ width: '140px', height: '140px', top: '40%', left: '45%', border: '1px dashed rgba(140,180,100,0.18)', borderRadius: '50%', transform: 'translate(-50%,-50%)', position: 'absolute' }} />

                    <div className="dash-map__dot dash-map__dot--stable"   style={{ top: '38%', left: '44%' }} />
                    <div className="dash-map__dot dash-map__dot--elevated"  style={{ top: '25%', left: '62%' }} />
                    <div className="dash-map__dot dash-map__dot--moderate"  style={{ top: '58%', left: '30%' }} />
                    <div className="dash-map__dot dash-map__dot--stable"   style={{ top: '70%', left: '55%' }} />
                    <div className="dash-map__dot dash-map__dot--elevated"  style={{ top: '20%', left: '25%' }} />

                    <div className="dash-map__legend">
                      <span className="legend-stable">Stable</span>
                      <span className="legend-moderate">Moderate</span>
                      <span className="legend-elevated">Elevated</span>
                    </div>
                  </div>
                </div>

                {/* Mini metrics row */}
                <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
                  {[
                    { label: 'Active Incidents', value: '1,284', change: '+12%', up: true },
                    { label: 'Accuracy', value: '98%', change: '↑ stable', up: false },
                    { label: 'Avg Response', value: '12s', change: '↓ 3s', up: false },
                  ].map(({ label, value, change, up }) => (
                    <div className="dash-metric" key={label}>
                      <div className="dash-metric__label">{label}</div>
                      <div className="dash-metric__value">
                        {value}
                        <span className={`dash-metric__change dash-metric__change--${up ? 'up' : 'down'}`}>{change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust Bar ────────────────────────────────────────── */}
        <div className="section--alt">
          <div className="container">
            <div className="trust-bar">
              {[
                {
                  title: 'YOLOv8 Detection',
                  desc: '98% classification accuracy across 14 hazard categories',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <rect x="2" y="2" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 11l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  title: 'Community-Powered',
                  desc: '140,000+ verified field reporters across 28 states',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="15" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M2 18c0-3.314 2.686-6 6-6M11 18c0-3.314 2.686-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: 'ML-Driven Insights',
                  desc: 'Predictive models surface risk patterns before incidents escalate',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path d="M3 17l5-5 4 4 7-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
              ].map(({ title, desc, icon }) => (
                <div className="trust-item" key={title}>
                  <div className="icon-circle">
                    {icon}
                  </div>
                  <div className="trust-item__text">
                    <h4>{title}</h4>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── How It Works / Pipeline ───────────────────────────── */}
        <section className="section" id="how-it-works">
          <div className="container">
            <div style={{ textAlign: 'center' }} className="animate-in">
              <p className="section-subtitle">Workflow</p>
              <h2 className="display-lg">How EcoView Works</h2>
              <p className="section-subtitle" style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '16px', color: 'var(--text-secondary)', marginTop: '12px' }}>
                From citizen report to coordinated action — four intelligent steps powered by ML.
              </p>
            </div>

            <div className="pipeline animate-in">
              {[
                {
                  num: '01',
                  title: 'Report',
                  desc: 'Citizens submit photos, GPS location, and incident descriptions via web or mobile.',
                  icon: (
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                      <path d="M13 3C9.134 3 6 6.134 6 10c0 5 7 14 7 14s7-9 7-14c0-3.866-3.134-7-7-7z" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="13" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  ),
                },
                {
                  num: '02',
                  title: 'Classify',
                  desc: 'YOLOv8 ML model analyses the submission and assigns a hazard type with confidence score.',
                  icon: (
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                      <rect x="3" y="3" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M8 13l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  num: '03',
                  title: 'Alert',
                  desc: 'Verified incidents trigger real-time alerts to relevant NGOs, agencies, and subscribers.',
                  icon: (
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                      <path d="M13 3v2M5.5 5.5l1.4 1.4M3 13h2M5.5 20.5l1.4-1.4M13 21v2M20.5 20.5l-1.4-1.4M23 13h-2M20.5 5.5l-1.4 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <circle cx="13" cy="13" r="5" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  ),
                },
                {
                  num: '04',
                  title: 'Act',
                  desc: 'Responders use live dashboards and exportable data to coordinate clean-up and enforcement.',
                  icon: (
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                      <path d="M6 20l4-10 4 6 3-4 3 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
              ].map(({ num, title, desc, icon }) => (
                <div className="pipeline__step" key={num}>
                  <div className="icon-circle icon-circle--lg">
                    {icon}
                  </div>
                  <div className="pipeline__num">{num}</div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Capabilities Grid ─────────────────────────────────── */}
        <section className="section section--alt" id="capabilities">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }} className="animate-in">
              <p className="section-subtitle">Capabilities</p>
              <h2 className="display-lg">Built for Every Scale of Response</h2>
            </div>

            <div className="capabilities-grid animate-in">
              {/* Featured card */}
              <div className="card card--featured cap-card">
                <span className="cap-card__label">Core Engine</span>
                <h3 className="heading-lg cap-card__title">Multimodal Hazard Classification</h3>
                <p className="body-md cap-card__desc">
                  EcoView ingests photos, satellite imagery, audio samples, and sensor telemetry simultaneously. The unified ML pipeline fuses these modalities to deliver classification confidence that no single-source system can match.
                </p>
                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['Water Pollution', 'Air Quality', 'Illegal Dumping', 'Deforestation', 'Noise', 'Soil Contamination'].map((tag) => (
                    <span key={tag} className="badge">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Regular cards */}
              <div className="card cap-card">
                <span className="cap-card__label">Geospatial</span>
                <div className="icon-circle">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M11 3v16M3 11h16" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
                    <ellipse cx="11" cy="11" rx="4" ry="8" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
                  </svg>
                </div>
                <h3 className="heading-lg cap-card__title">High-Fidelity Mapping</h3>
                <p className="body-md cap-card__desc">
                  Sub-10-metre resolution incident pinning on an interactive map. Cluster heat-zones, draw custom polygons for monitoring areas, and export GeoJSON for GIS workflows.
                </p>
              </div>

              <div className="card cap-card">
                <span className="cap-card__label">Intelligence</span>
                <div className="icon-circle">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M3 16l5-5 4 4 7-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="heading-lg cap-card__title">Predictive Risk Modelling</h3>
                <p className="body-md cap-card__desc">
                  Time-series forecasting identifies seasonal pollution trends and flags areas at elevated risk — giving agencies a 48-hour early-warning advantage before incidents occur.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Solutions ─────────────────────────────────────────── */}
        <section className="section" id="solutions">
          <div className="container">
            <div style={{ marginBottom: '3rem' }} className="animate-in">
              <p className="section-subtitle">Solutions</p>
              <h2 className="display-lg">Tailored for Every Stakeholder</h2>
            </div>

            <div className="solutions-content animate-in">
              {/* Sidebar tabs */}
              <div className="solutions-sidebar">
                {solData.map((sol, i) => (
                  <button
                    key={sol.label}
                    className={`solutions-sidebar__item${activeSol === i ? ' active' : ''}`}
                    onClick={() => setActiveSol(i)}
                  >
                    <span className="s-icon">{sol.icon}</span>
                    {sol.label}
                  </button>
                ))}
              </div>

              {/* Visual panel */}
              <div className="solutions-visual">
                <div>
                  <p className="cap-card__label">{solData[activeSol].label}</p>
                  <h3 className="heading-lg" style={{ marginTop: '0.5rem' }}>{solData[activeSol].heading}</h3>
                  <p className="body-md" style={{ marginTop: '0.75rem' }}>{solData[activeSol].desc}</p>
                </div>

                <div className="solutions-features">
                  {solData[activeSol].features.map(({ title, desc }) => (
                    <div className="solutions-feature" key={title}>
                      <div className="icon-circle icon-circle--sm" style={{ marginTop: '2px' }}>
                        <CheckIcon />
                      </div>
                      <div className="solutions-feature__text">
                        <h4>{title}</h4>
                        <p>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  <a href="#" className="btn btn-primary btn-sm">
                    Learn more about {solData[activeSol].label}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bento Features Grid ───────────────────────────────── */}
        <section className="section section--alt" id="features">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '0' }} className="animate-in">
              <p className="section-subtitle">Features</p>
              <h2 className="display-lg">Every Tool You Need</h2>
            </div>

            <div className="bento animate-in">
              {/* Smart Classification — wide */}
              <div className="bento__card bento__card--wide">
                <div className="icon-circle">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="2" y="2" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 11l4 4 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="heading-lg">Smart Classification</h3>
                <p className="body-md">
                  YOLOv8 processes submitted images in under 2 seconds, assigning a hazard category, severity level, and confidence score. Our active-learning loop continuously improves accuracy with every verified report.
                </p>
                <div className="bento__card__viz">
                  {/* Simulated classification UI */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'Water Pollution', pct: 87, color: '#4da6e0' },
                      { label: 'Illegal Dumping', pct: 9,  color: '#e06070' },
                      { label: 'Other',            pct: 4,  color: '#a0a09a' },
                    ].map(({ label, pct, color }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', width: '110px', flexShrink: 0 }}>{label}</span>
                        <div style={{ flex: 1, height: '6px', background: 'var(--gray-100)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '30px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* High-Fidelity Mapping */}
              <div className="bento__card">
                <div className="icon-circle">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 3C7.686 3 5 5.686 5 9c0 5.25 6 11 6 11s6-5.75 6-11c0-3.314-2.686-6-6-6z" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="11" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <h3 className="heading-lg">High-Fidelity Mapping</h3>
                <p className="body-md">Sub-10-metre precision pinning with cluster heat-zones and custom monitoring polygon exports.</p>
              </div>

              {/* Community Intelligence */}
              <div className="bento__card">
                <div className="icon-circle">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="15" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M2 19c0-3.314 2.686-6 6-6M11 19c0-3.314 2.686-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="heading-lg">Community Intelligence</h3>
                <p className="body-md">140K+ verified reporters create a self-reinforcing data network that grows more accurate with every submission.</p>
              </div>

              {/* Automated Alerts */}
              <div className="bento__card">
                <div className="icon-circle">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 2v2M4.22 4.22l1.42 1.42M2 11h2M4.22 17.78l1.42-1.42M11 18v2M17.78 17.78l-1.42-1.42M20 11h-2M17.78 4.22l-1.42 1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <h3 className="heading-lg">Automated Alerts</h3>
                <p className="body-md">Real-time push, email, and webhook alerts dispatched within 12 seconds of incident verification.</p>
              </div>

              {/* NGO Campaigns */}
              <div className="bento__card">
                <div className="icon-circle">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="16" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M1 19c0-3.314 2.686-5 6-5M10 19c0-3.314 2.686-5 6-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M11.5 13h4.5v4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="heading-lg">NGO Campaigns</h3>
                <p className="body-md">Partner NGOs coordinate targeted clean-up campaigns. Join drives near you, track volunteer sign-ups, and see real impact in your community.</p>
              </div>

              {/* Predictive Analytics — full width */}
              <div className="bento__card bento__card--full">
                <div className="icon-circle">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M3 17l5-5 4 4 7-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="heading-lg">Predictive Analytics</h3>
                <p className="body-md">
                  Time-series models trained on 5 years of incident data surface seasonal risk patterns and regional pollution forecasts — so agencies can prepare before hazards escalate.
                </p>
                <div className="bento__card__viz">
                  {/* Simulated sparkline chart */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '56px' }}>
                    {[30, 45, 38, 60, 52, 70, 65, 80, 72, 88, 76, 92].map((h, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: `${h}%`,
                          background: i >= 9 ? 'var(--green-400)' : 'var(--green-200)',
                          borderRadius: '3px 3px 0 0',
                          opacity: 0.85,
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    <span>Jan</span><span>Mar</span><span>Jun</span><span>Sep</span><span>Dec</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Dashboard Preview ─────────────────────────────────── */}
        <section className="section">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }} className="animate-in">
              <p className="section-subtitle">Platform</p>
              <h2 className="display-lg">Live Climate Terrain Dashboard</h2>
              <p className="section-subtitle" style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '16px', color: 'var(--text-secondary)', marginTop: '12px' }}>
                A real-time command centre that gives every stakeholder a shared operational picture.
              </p>
            </div>

            <div className="dash-preview animate-in">
              <div className="dash-topbar">
                <div className="dash-topbar__tabs">
                  <span className="dash-topbar__tab active">Terrain Map</span>
                  <span className="dash-topbar__tab">Incident Log</span>
                  <span className="dash-topbar__tab">Analytics</span>
                  <span className="dash-topbar__tab">Reports</span>
                </div>
                <span className="dash-topbar__status">Live — updated 3s ago</span>
              </div>

              <div className="dash-body">
                {/* Sidebar nav */}
                <div className="dash-sidebar">
                  <div className="dash-sidebar__logo">
                    <EcoViewLogo />
                    EcoView
                  </div>
                  <div className="dash-sidebar__sub">Navigation</div>
                  {[
                    { label: 'Dashboard', active: true,  icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" /></svg> },
                    { label: 'Incidents',  active: false, icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5L12.5 12H1.5L7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M7 5.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><circle cx="7" cy="10" r="0.75" fill="currentColor" /></svg> },
                    { label: 'Map View',   active: false, icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5C4.515 1.5 2.5 3.515 2.5 6c0 3.5 4.5 7 4.5 7s4.5-3.5 4.5-7C11.5 3.515 9.485 1.5 7 1.5z" stroke="currentColor" strokeWidth="1.2" /><circle cx="7" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2" /></svg> },
                    { label: 'Analytics',  active: false, icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 11l3-3 3 3 4-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
                    { label: 'Alerts',     active: false, icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v1M3.05 3.05l.71.71M1 7h1M3.05 10.95l.71-.71M7 12v1M10.95 10.95l-.71-.71M13 7h-1M10.95 3.05l-.71.71" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2" /></svg> },
                    { label: 'Settings',   active: false, icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" /><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.929 2.929l1.06 1.06M9.97 9.97l1.06 1.06M2.929 11.07l1.06-1.06M9.97 4.03l1.06-1.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg> },
                  ].map(({ label, active, icon }) => (
                    <div key={label} className={`dash-nav-item${active ? ' active' : ''}`}>
                      {icon}
                      {label}
                    </div>
                  ))}
                </div>

                {/* Main map area */}
                <div className="dash-main">
                  <div className="dash-main__title">Live Climate Terrain</div>
                  <div className="dash-main__sub">Showing 1,284 active incidents — India region</div>
                  <div className="dash-map" style={{ flex: 1, minHeight: '260px' }}>
                    {/* Contour rings */}
                    {[100, 160, 220].map((size, i) => (
                      <div
                        key={i}
                        className="dash-map__contour"
                        style={{
                          width: size,
                          height: size,
                          top: '45%',
                          left: '48%',
                          transform: 'translate(-50%,-50%)',
                          position: 'absolute',
                          border: `1px dashed rgba(140,180,100,${0.28 - i * 0.07})`,
                          borderRadius: '50%',
                        }}
                      />
                    ))}

                    {/* Dots */}
                    {[
                      { cl: 'stable',   top: '43%', left: '47%' },
                      { cl: 'elevated', top: '28%', left: '63%' },
                      { cl: 'moderate', top: '60%', left: '32%' },
                      { cl: 'stable',   top: '70%', left: '58%' },
                      { cl: 'elevated', top: '22%', left: '28%' },
                      { cl: 'moderate', top: '52%', left: '72%' },
                      { cl: 'stable',   top: '35%', left: '22%' },
                    ].map(({ cl, top, left }, i) => (
                      <div key={i} className={`dash-map__dot dash-map__dot--${cl}`} style={{ top, left }} />
                    ))}

                    <div className="dash-map__legend">
                      <span className="legend-stable">Stable</span>
                      <span className="legend-moderate">Moderate</span>
                      <span className="legend-elevated">Elevated</span>
                    </div>
                  </div>
                </div>

                {/* Right metrics panel */}
                <div className="dash-metrics">
                  {[
                    { label: 'Total Classified', value: '2.4M', change: '+18% this month' },
                    { label: 'Active Now',       value: '1,284', change: '+12 in last hour' },
                    { label: 'ML Accuracy',      value: '98%',  change: 'Above baseline' },
                    { label: 'Avg Response',     value: '12s',  change: '↓ 3s vs last wk' },
                    { label: 'Reporters Online', value: '4,821', change: 'Peak: 09:00–11:00' },
                  ].map(({ label, value, change }) => (
                    <div className="dash-metric" key={label}>
                      <div className="dash-metric__label">{label}</div>
                      <div className="dash-metric__value">{value}</div>
                      <div className="dash-metric__change dash-metric__change--down">{change}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Data Sources ──────────────────────────────────────── */}
        <section className="section section--alt" id="data-sources">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '0' }} className="animate-in">
              <p className="section-subtitle">Integrations</p>
              <h2 className="display-lg">8 Data Streams, One Intelligence Layer</h2>
            </div>

            <div className="data-grid animate-in">
              {[
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M14 4v20M4 14h20" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
                      <ellipse cx="14" cy="14" rx="5" ry="10" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
                    </svg>
                  ),
                  title: 'Sentinel-2',
                  desc: 'ESA satellite imagery at 10m resolution',
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="4" y="4" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 14l5 5 7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: 'Community Reports',
                  desc: 'Verified field submissions from 140K reporters',
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M6 22l5-5 5 5 6-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="21" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  ),
                  title: 'Air Quality Sensors',
                  desc: 'Government CPCB network + private IoT nodes',
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M5 18s2-4 5-4 4 4 7 4 6-4 6-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M5 13s2-4 5-4 4 4 7 4 6-4 6-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
                    </svg>
                  ),
                  title: 'Water Quality Buoys',
                  desc: 'Real-time pH, turbidity, and chemical readings',
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M14 3C8.477 3 4 7.477 4 13c0 7 10 16 10 16s10-9 10-16c0-5.523-4.477-10-10-10z" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="14" cy="13" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  ),
                  title: 'Landsat-9',
                  desc: 'NASA 30m multispectral land cover data',
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="3" y="5" width="22" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M3 10h22" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="8" cy="7.5" r="1" fill="currentColor" opacity="0.5" />
                      <circle cx="12" cy="7.5" r="1" fill="currentColor" opacity="0.5" />
                    </svg>
                  ),
                  title: 'Social Media NLP',
                  desc: 'Pollution signals extracted from public posts',
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M7 8h14M7 13h10M7 18h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  ),
                  title: 'News Feeds',
                  desc: 'Automated NLP scanning of 2,400+ news sources',
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="4" y="14" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="11" y="9" width="5" height="15" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="18" y="4" width="5" height="20" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  ),
                  title: 'Government APIs',
                  desc: 'Pollution Control Board & municipal data feeds',
                },
              ].map(({ icon, title, desc }) => (
                <div className="data-card" key={title}>
                  <div className="icon-circle icon-circle--lg">{icon}</div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Impact Stats ──────────────────────────────────────── */}
        <section className="section">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }} className="animate-in">
              <p className="section-subtitle">Impact</p>
              <h2 className="display-lg">Numbers That Drive Action</h2>
            </div>

            <div className="stats-grid animate-in">
              {[
                { value: '2.4', unit: 'M', label: 'Incidents Classified' },
                { value: '140', unit: 'K', label: 'Community Reporters' },
                { value: '98',  unit: '%', label: 'Classification Accuracy' },
                { value: '12',  unit: 's', label: 'Average Response Time' },
              ].map(({ value, unit, label }) => (
                <div key={label}>
                  <div className="stat__value">
                    {value}<span>{unit}</span>
                  </div>
                  <div className="stat__label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────── */}
        <section className="section section--alt" id="pricing">
          <div className="container">
            <div style={{ textAlign: 'center' }} className="animate-in">
              <p className="section-subtitle">Pricing</p>
              <h2 className="display-lg">Start Free, Scale with Impact</h2>
              <p className="section-subtitle" style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '16px', color: 'var(--text-secondary)', marginTop: '12px' }}>
                Every tier includes core classification and community access. Upgrade for deeper data and API power.
              </p>
            </div>

            <div className="pricing-grid animate-in">
              {/* Community / Free */}
              <div className="card pricing-card">
                <p className="pricing-card__label">Community</p>
                <div className="pricing-card__price">
                  Free <span>/ forever</span>
                </div>
                <p className="pricing-card__desc">For individual citizens and small community groups who want to make a difference locally.</p>
                <div className="pricing-card__features">
                  {[
                    'Unlimited incident reports',
                    'YOLOv8 auto-classification',
                    'Interactive public map',
                    'Community verification',
                    'Email alerts for saved areas',
                  ].map((f) => (
                    <div className="pricing-card__feature" key={f}>
                      <CheckIcon />
                      {f}
                    </div>
                  ))}
                </div>
                <a href="#" className="btn btn-secondary">Get Started Free</a>
              </div>

              {/* Organisation / Popular */}
              <div className="card pricing-card" style={{ position: 'relative' }}>
                <div className="pricing-popular">Most Popular</div>
                <p className="pricing-card__label">Organisation</p>
                <div className="pricing-card__price">
                  $49 <span>/ month</span>
                </div>
                <p className="pricing-card__desc">For NGOs, research labs, and municipal agencies that need API access and advanced analytics.</p>
                <div className="pricing-card__features">
                  {[
                    'Everything in Community',
                    'Full REST & GraphQL API',
                    'Advanced analytics dashboard',
                    'Custom monitoring polygons',
                    'Webhook & push alerts',
                    'CSV / GeoJSON export',
                    'Priority classification queue',
                  ].map((f) => (
                    <div className="pricing-card__feature" key={f}>
                      <CheckIcon />
                      {f}
                    </div>
                  ))}
                </div>
                <Link to="/report" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Start 14-day Trial
                </Link>
              </div>

              {/* Enterprise / Custom */}
              <div className="card pricing-card">
                <p className="pricing-card__label">Enterprise</p>
                <div className="pricing-card__price">
                  Custom <span>/ contact us</span>
                </div>
                <p className="pricing-card__desc">For state and national government bodies requiring SLA guarantees, on-premise options, and dedicated support.</p>
                <div className="pricing-card__features">
                  {[
                    'Everything in Organisation',
                    'On-premise / private cloud',
                    'Custom model fine-tuning',
                    'Dedicated ML engineer',
                    '99.9% uptime SLA',
                    'Audit-trail compliance logs',
                    'White-label dashboard',
                  ].map((f) => (
                    <div className="pricing-card__feature" key={f}>
                      <CheckIcon />
                      {f}
                    </div>
                  ))}
                </div>
                <a href="#" className="btn btn-secondary">Contact Sales</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section className="section">
          <div className="container">
            <div className="cta-section animate-in">
              <p className="section-subtitle">Get Started</p>
              <h2 className="display-lg">Ready to Protect Your Environment?</h2>
              <p className="body-lg" style={{ maxWidth: '520px' }}>
                Join 140,000 community reporters and dozens of NGOs who trust EcoView to turn raw observations into coordinated environmental action.
              </p>
              <div className="cta-actions">
                <Link to="/report" className="btn btn-primary btn-lg">
                  Report Your First Incident
                </Link>
                <Link to="/map-view" className="btn btn-outline btn-lg">
                  Experience the Platform
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ──────────────────────────────────────── */}
        <section className="section section--alt">
          <div className="container">
            <div className="testimonials-grid animate-in">
              {/* Left: heading + nav */}
              <div>
                <p className="section-subtitle">Testimonials</p>
                <h2 className="display-md">Trusted by Environmental Champions</h2>
                <p className="body-md" style={{ marginTop: '1rem' }}>
                  Hear from the NGOs, researchers, and citizens who rely on EcoView every day.
                </p>
                <div className="testimonials-nav">
                  <button aria-label="Previous testimonials">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button aria-label="Next testimonials">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right: 2 stacked quote cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="testimonial-card">
                  <div className="testimonial-card__quote">"</div>
                  <p className="testimonial-card__text">
                    EcoView cut our incident response time from 3 days to under 4 hours. The YOLOv8 classification is frighteningly accurate — our field teams now spend time acting, not triaging.
                  </p>
                  <div className="testimonial-card__author">
                    <div className="testimonial-card__avatar">PK</div>
                    <div>
                      <div className="testimonial-card__name">Priya Krishnamurthy</div>
                      <div className="testimonial-card__role">Director of Operations, GreenWatch India</div>
                    </div>
                  </div>
                </div>

                <div className="testimonial-card">
                  <div className="testimonial-card__quote">"</div>
                  <p className="testimonial-card__text">
                    We built our state pollution monitoring framework on EcoView's API. The data quality and reliability are far beyond what we could achieve with our own sensor network alone.
                  </p>
                  <div className="testimonial-card__author">
                    <div className="testimonial-card__avatar">AR</div>
                    <div>
                      <div className="testimonial-card__name">Arjun Reddy</div>
                      <div className="testimonial-card__role">Principal Scientist, Telangana State PCB</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section className="section" id="faq">
          <div className="container">
            <div style={{ textAlign: 'center' }} className="animate-in">
              <p className="section-subtitle">FAQ</p>
              <h2 className="display-lg">Common Questions</h2>
            </div>

            <div className="faq-list animate-in">
              {faqItems.map(({ q, a }, i) => (
                <div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
                  <button
                    className="faq-item__q"
                    onClick={() => toggleFaq(i)}
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
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <div className="footer__top">
            {/* Brand col */}
            <div className="footer__brand">
              <div className="footer__logo">
                <EcoViewLogo />
                EcoView
              </div>
              <p className="footer__desc">
                Real-time environmental hazard detection powered by community data and YOLOv8 ML.
              </p>

              {/* Newsletter */}
              <div className="footer__newsletter">
                <input
                  type="email"
                  className="footer__input"
                  placeholder="Enter your email"
                  aria-label="Newsletter email"
                />
                <button className="btn btn-primary btn-sm">Subscribe</button>
              </div>

              {/* Social */}
              <div className="footer__social">
                {/* Twitter / X */}
                <a href="#" className="footer__social a" aria-label="Twitter">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M13 1.5L8 6.5M13 1.5H9.5M13 1.5V5M1 12.5l5-5m0 0L1 1.5h4l3 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                {/* GitHub */}
                <a href="#" className="footer__social a" aria-label="GitHub">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1C3.686 1 1 3.686 1 7c0 2.652 1.716 4.906 4.098 5.7.3.055.41-.13.41-.29v-1.016c-1.67.362-2.02-.806-2.02-.806-.273-.693-.667-.878-.667-.878-.545-.373.04-.365.04-.365.603.042.92.618.92.618.535.918 1.403.652 1.744.499.055-.388.21-.652.382-.802-1.334-.152-2.735-.667-2.735-2.968 0-.656.234-1.192.618-1.613-.062-.152-.268-.763.059-1.59 0 0 .504-.16 1.65.616A5.73 5.73 0 017 4.684a5.73 5.73 0 011.499.203c1.146-.776 1.649-.617 1.649-.617.327.828.121 1.438.06 1.59.385.42.617.957.617 1.613 0 2.308-1.404 2.815-2.74 2.963.215.185.407.55.407 1.11v1.644c0 .16.109.347.413.289C11.285 11.904 13 9.651 13 7c0-3.314-2.686-6-6-6z" fill="currentColor" />
                  </svg>
                </a>
                {/* LinkedIn */}
                <a href="#" className="footer__social a" aria-label="LinkedIn">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M4 6v4M4 4.5v.01M7 10V7.5C7 6.67 7.67 6 8.5 6S10 6.67 10 7.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Link columns */}
            <div className="footer__column">
              <h4>Platform</h4>
              <a href="#">Report Incident</a>
              <a href="#">Interactive Map</a>
              <a href="#">Analytics Dashboard</a>
              <a href="#">API Documentation</a>
              <a href="#">Mobile App</a>
            </div>

            <div className="footer__column">
              <h4>Solutions</h4>
              <a href="#">For NGOs</a>
              <a href="#">For Communities</a>
              <a href="#">For Government</a>
              <a href="#">For Researchers</a>
              <a href="#">Enterprise</a>
            </div>

            <div className="footer__column">
              <h4>Company</h4>
              <a href="#">About EcoView</a>
              <a href="#">Our ML Model</a>
              <a href="#">Impact Report</a>
              <a href="#">Blog</a>
              <a href="#">Contact Us</a>
            </div>
          </div>

          <div className="footer__bottom">
            <span>© 2025 EcoView. All rights reserved.</span>
            <div className="footer__legal">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
