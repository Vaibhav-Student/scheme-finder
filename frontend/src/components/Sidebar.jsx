import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiGrid, FiUser, FiShield, FiLogOut, FiSettings, FiDatabase, FiCheckCircle, FiCpu, FiList, FiUsers } from 'react-icons/fi';
import './Sidebar.css';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { isAdmin, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <>
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} aria-label="Sidebar navigation">
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-brand">
            <div className="brand-logo" aria-hidden="true">S</div>
            <span className="brand-text">Schemes</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/dashboard"
            className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <FiGrid size={20} className="sidebar-icon" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/form"
            className={`sidebar-link ${isActive('/form') ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <FiUser size={20} className="sidebar-icon" />
            <span>My Profile</span>
          </Link>

          {isAdmin && (
            <>
              <div className="sidebar-divider">Admin</div>
              <Link
                to="/admin"
                className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <FiShield size={20} className="sidebar-icon" />
                <span>Admin Panel</span>
              </Link>
              <Link
                to="/admin/add-scheme"
                className={`sidebar-link ${isActive('/admin/add-scheme') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <FiDatabase size={20} className="sidebar-icon" />
                <span>Add Schemes</span>
              </Link>
              <Link
                to="/admin/active-schemes"
                className={`sidebar-link ${isActive('/admin/active-schemes') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <FiCheckCircle size={20} className="sidebar-icon" />
                <span>Active Schemes</span>
              </Link>
              <Link
                to="/admin/ai-assistant"
                className={`sidebar-link ${isActive('/admin/ai-assistant') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <FiCpu size={20} className="sidebar-icon" />
                <span>AI Scheme Finder</span>
              </Link>
              <Link
                to="/admin/review"
                className={`sidebar-link ${isActive('/admin/review') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <FiList size={20} className="sidebar-icon" />
                <span>Review Queue</span>
              </Link>
              <Link
                to="/admin/users"
                className={`sidebar-link ${isActive('/admin/users') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <FiUsers size={20} className="sidebar-icon" />
                <span>Registered User</span>
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <Link
            to="#"
            className="sidebar-link"
          >
            <FiSettings size={20} className="sidebar-icon" />
            <span>Settings</span>
          </Link>
          <button className="sidebar-link sidebar-logout" onClick={logout}>
            <FiLogOut size={20} className="sidebar-icon" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
