import { Link } from 'react-router-dom';
import '../styles/ecoview.css';

const EcoViewLogo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <path d="M16 2L28.124 9V23L16 30L3.876 23V9L16 2Z" fill="#a8cc38" fillOpacity="0.15" stroke="#a8cc38" strokeWidth="1.5" />
    <path d="M16 8C12.686 8 10 10.686 10 14c0 3.314 2.686 6 6 6s6-2.686 6-6c0-3.314-2.686-6-6-6z" fill="#a8cc38" fillOpacity="0.35" />
    <path d="M16 11c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" fill="#a8cc38" />
    <path d="M16 17v7" stroke="#a8cc38" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">

          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <EcoViewLogo />
              EcoView
            </div>
            <p className="footer__desc">
              Community-powered environmental hazard detection — real-time ML classification, geospatial analytics, and open-source infrastructure.
            </p>
            <a
              href="https://github.com/1mystic/EcoView"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '13px', color: 'var(--green-400)', textDecoration: 'none' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--green-400)'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>

          {/* Platform */}
          <div className="footer__column">
            <h4>Platform</h4>
            <Link to="/map-view">Interactive Map</Link>
            <Link to="/report">Report Incident</Link>
            <Link to="/campaigns">Campaigns</Link>
            <Link to="/leaderboard">Leaderboard</Link>
          </div>

          {/* Learn */}
          <div className="footer__column">
            <h4>Learn</h4>
            <Link to="/about">About EcoView</Link>
            <Link to="/how-to-use">How It Works</Link>
            <Link to="/contribute">Contribute</Link>
          </div>

          {/* Account */}
          <div className="footer__column">
            <h4>Account</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
            <Link to="/ngo-register">NGO Registration</Link>
          </div>

        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} EcoView. All rights reserved.</span>
          <div className="footer__legal">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
