import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import RegisterTypeDialog from './RegisterTypeDialog';

const EcoViewLogo = () => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M14 2L4 8v12l10 6 10-6V8L14 2z" fill="#a8cc38" opacity="0.15"/>
    <path d="M14 2L4 8v12l10 6 10-6V8L14 2z" stroke="#6d8f19" strokeWidth="1.5" fill="none"/>
    <path d="M9 14c0-3 2.5-6 5-6s5 3 5 6-2.5 4-5 6c-2.5-2-5-3-5-6z" fill="#8ab420"/>
    <path d="M14 10v8M11 13l3-3 3 3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function Navbar() {
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setIsAuthenticated(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() };
            setUser(userData);
            setIsAdmin(userData.role === 'admin');
          } else {
            setUser({ id: currentUser.uid, uid: currentUser.uid });
            setIsAdmin(false);
          }
        } catch {
          setUser({ id: currentUser.uid, uid: currentUser.uid });
          setIsAdmin(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${scrolled ? '#e5e5e2' : 'rgba(229,229,226,0.6)'}`,
        boxShadow: scrolled ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
        transition: 'background 250ms ease, border-color 250ms ease, box-shadow 250ms ease',
        fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '12px clamp(20px, 4vw, 48px)',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}>
          {/* Logo */}
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: '#1e1e1c',
            textDecoration: 'none',
            flexShrink: 0,
          }}>
            <EcoViewLogo />
            EcoView
          </Link>

          {/* Desktop Nav Links */}
          {!loading && (
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#f8f8f6',
              borderRadius: 999,
              padding: 4,
              margin: '0 auto',
              flexWrap: 'nowrap',
            }}>
              {!isAuthenticated && (
                <>
                  <NavLink to="/map-view" active={isActive('/map-view')}>Map</NavLink>
                  <NavLink to="/report" active={isActive('/report')}>Report</NavLink>
                  <NavLink to="/campaigns" active={isActive('/campaigns')}>Campaigns</NavLink>
                  <NavLink to="/leaderboard" active={isActive('/leaderboard')}>Leaderboard</NavLink>
                </>
              )}
              {isAuthenticated && isAdmin && (
                <>
                  <NavLink to="/admin" active={isActive('/admin')}>Dashboard</NavLink>
                  <NavLink to="/map-view" active={isActive('/map-view')}>Map</NavLink>
                  <NavLink to="/campaigns" active={isActive('/campaigns')}>Campaigns</NavLink>
                  <NavLink to="/ngo-invite" active={isActive('/ngo-invite')}>NGO Invite</NavLink>
                  <NavLink to="/leaderboard" active={isActive('/leaderboard')}>Leaderboard</NavLink>
                </>
              )}
              {isAuthenticated && !isAdmin && user?.id && (
                <>
                  <NavLink to={`/user-dashboard/${user.id}`} active={isActive(`/user-dashboard/${user.id}`)}>Dashboard</NavLink>
                  <NavLink to="/map-view" active={isActive('/map-view')}>Map</NavLink>
                  <NavLink to="/report" active={isActive('/report')}>Report</NavLink>
                  <NavLink to="/campaigns" active={isActive('/campaigns')}>Campaigns</NavLink>
                  {user?.role === 'ngo' && <NavLink to="/ngo-dashboard" active={isActive('/ngo-dashboard')}>NGO Hub</NavLink>}
                  <NavLink to="/leaderboard" active={isActive('/leaderboard')}>Leaderboard</NavLink>
                </>
              )}
            </nav>
          )}

          {/* Auth Actions */}
          {!loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 'auto' }}>
              {isAuthenticated ? (
                <button onClick={logout} style={secondaryBtnStyle}>
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" style={ghostBtnStyle}>Login</Link>
                  <button onClick={() => setRegisterDialogOpen(true)} style={primaryBtnStyle}>
                    Get Started
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <RegisterTypeDialog
        isOpen={registerDialogOpen}
        onOpenChange={setRegisterDialogOpen}
      />
    </>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 14,
      fontWeight: active ? 600 : 500,
      color: active ? '#1e1e1c' : '#555550',
      textDecoration: 'none',
      padding: '6px 14px',
      borderRadius: 999,
      background: active ? '#fff' : 'transparent',
      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
      transition: 'all 150ms ease',
      whiteSpace: 'nowrap',
    }}>
      {active && (
        <span style={{
          display: 'inline-block',
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#a8cc38',
          flexShrink: 0,
        }} />
      )}
      {children}
    </Link>
  );
}

const primaryBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '7px 18px',
  borderRadius: 999,
  fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  fontSize: 14,
  fontWeight: 600,
  background: '#a8cc38',
  color: '#222d09',
  border: '1px solid #a8cc38',
  cursor: 'pointer',
  boxShadow: '0 2px 12px rgba(168,204,56,0.25)',
  transition: 'all 200ms ease',
  whiteSpace: 'nowrap',
};

const secondaryBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '7px 18px',
  borderRadius: 999,
  fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  fontSize: 14,
  fontWeight: 500,
  background: 'transparent',
  color: '#555550',
  border: '1px solid #e5e5e2',
  cursor: 'pointer',
  transition: 'all 200ms ease',
};

const ghostBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '7px 14px',
  borderRadius: 999,
  fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  fontSize: 14,
  fontWeight: 500,
  color: '#555550',
  textDecoration: 'none',
  transition: 'color 150ms ease',
};

export default Navbar;
