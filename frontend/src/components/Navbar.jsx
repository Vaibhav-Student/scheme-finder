import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiSun, FiMoon, FiUser, FiLogOut } from 'react-icons/fi';
import LogoIcon from './LogoIcon';
import './Navbar.css';

export default function Navbar({ toggleSidebar, isAuthPage }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return document.body.getAttribute('data-theme') || 'light';
  });

  useEffect(() => {
    // Apply the saved theme state to the document body
    document.body.setAttribute('data-theme', theme);
    
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`} role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        {/* Left side */}
        <div className="navbar-left">
          {!isAuthPage && (
            <button
              className="sidebar-toggle-btn"
              onClick={toggleSidebar}
              aria-label="Open sidebar"
            >
              <FiMenu size={22} />
            </button>
          )}

          <Link to="/" className="navbar-brand">
            <div className="brand-logo" aria-hidden="true">
              <LogoIcon size={24} />
            </div>
            <span className="brand-text">Scheme Finder</span>
          </Link>
        </div>

        {/* Right side actions */}
        <div className="navbar-actions">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>

          {!isAuthenticated && isAuthPage && (
            <div className="navbar-auth-links">
              <Link to="/login" className="navbar-btn-signin">Sign In</Link>
              <Link to="/signup" className="navbar-btn-getstarted">Get Started</Link>
            </div>
          )}

          {isAuthenticated && (
            <>
              <div className="navbar-user">
                <span className="user-greeting">Hi, {user?.username || 'User'}</span>
                <div className="avatar">
                  <FiUser size={18} />
                </div>
              </div>
              <button
                className="logout-btn"
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
              >
                <FiLogOut size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
