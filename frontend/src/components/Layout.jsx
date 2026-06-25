import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AccessibilityToolbar from './AccessibilityToolbar';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isLandingPage) {
    return (
      <div className="app-wrapper">
        <main id="main-content" className="main-content-public" style={{ marginTop: 0 }}>
          {children}
        </main>
      </div>
    );
  }

  if (!isAuthenticated || isAuthPage) {
    return (
      <div className="app-wrapper">
        <Navbar toggleSidebar={() => {}} isAuthPage={true} />
        <main id="main-content" className="main-content-public">
          {children}
        </main>
        <AccessibilityToolbar />
      </div>
    );
  }

  return (
    <div className="app-wrapper app-wrapper-dashboard">
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
      <div className="dashboard-content-wrapper">
        <Navbar toggleSidebar={() => setMobileSidebarOpen(true)} isAuthPage={false} />
        <main id="main-content" className="main-content-dashboard">
          {children}
        </main>
      </div>
      <AccessibilityToolbar />
    </div>
  );
}

