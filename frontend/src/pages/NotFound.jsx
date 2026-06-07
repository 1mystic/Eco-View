import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/ecoview.css';

const EcoViewLogo = () => (
  <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2L28.124 9V23L16 30L3.876 23V9L16 2Z" fill="#a8cc38" fillOpacity="0.15" stroke="#a8cc38" strokeWidth="1.5" />
    <path d="M16 8C12.686 8 10 10.686 10 14C10 17.314 12.686 20 16 20C19.314 20 22 17.314 22 14C22 10.686 19.314 8 16 8Z" fill="#a8cc38" fillOpacity="0.35" />
    <path d="M16 11C14.343 11 13 12.343 13 14C13 15.657 14.343 17 16 17C17.657 17 19 15.657 19 14C19 12.343 17.657 11 16 11Z" fill="#a8cc38" />
    <path d="M16 17V24" stroke="#a8cc38" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M13 20.5H19" stroke="#a8cc38" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404: No route matches', location.pathname);
  }, [location.pathname]);

  return (
    <div className="not-found">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', textDecoration: 'none' }}>
        <EcoViewLogo />
        EcoView
      </Link>

      <div className="not-found__number">404</div>

      <div>
        <p className="not-found__title">Page not found</p>
        <p className="not-found__desc">
          The route <code style={{ fontFamily: 'monospace', fontSize: '14px', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '4px' }}>{location.pathname}</code> doesn't exist. You might have followed a broken link or mistyped the address.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="btn btn-primary btn-lg">Back to Home</Link>
        <Link to="/map-view" className="btn btn-secondary btn-lg">Explore the Map</Link>
      </div>
    </div>
  );
};

export default NotFound;
