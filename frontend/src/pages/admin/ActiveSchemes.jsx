import { useState, useEffect } from 'react';
import { FiCheckCircle, FiSearch, FiBriefcase, FiCalendar, FiDollarSign, FiUsers, FiExternalLink, FiEdit3 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import './Admin.css';
import './ActiveSchemes.css';

export default function ActiveSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      // 1. Fetch from SQLite backend
      let apiSchemes = [];
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/schemes');
        const data = await res.json();
        apiSchemes = Array.isArray(data) ? data : [];
      } catch {
        console.warn('SQLite backend fetch failed, relying on local storage demo schemes.');
      }

      // 2. Fetch from LocalStorage (Demo custom schemes added during prototyping)
      const customSchemes = JSON.parse(localStorage.getItem('demoCustomSchemes') || '[]');

      // Combine both sources
      const combined = [...apiSchemes, ...customSchemes];

      // Keep only active ones and remove duplicates by ID or name
      const uniqueActive = [];
      const seen = new Set();
      
      for (const s of combined) {
        if (s.is_active === false) continue;
        const key = s.id || s.name;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueActive.push(s);
        }
      }

      setSchemes(uniqueActive);
    } catch (error) { 
      toast.error('Failed to load schemes'); 
    }
    setLoading(false);
  };

  useEffect(() => { fetchSchemes(); }, []);

  const filtered = schemes.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || 
           (s.ministry && s.ministry.toLowerCase().includes(search.toLowerCase())) ||
           (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <LoadingSpinner message="Loading active schemes database..." />;

  return (
    <div className="active-schemes-container animate-fade-in" role="main" aria-label="Active Schemes">
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Active Government Schemes</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>
          Browse all currently active and verified schemes available in the system database.
        </p>
      </header>

      <div className="search-wrapper" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
        <div className="search-bar" style={{ position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="search" className="input-field" style={{ paddingLeft: 46, width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
            placeholder="Search by scheme name, ministry, or keywords..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search schemes"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <FiSearch size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: '#475569' }}>No active schemes found</h3>
          <p style={{ color: '#64748b' }}>Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="active-schemes-grid">
          {filtered.map((s) => (
            <div key={s.id || s.name} className="scheme-pro-card">
              <div className="card-top-banner"></div>
              
              <div className="card-header-content">
                <span className="scheme-type-badge">{s.scheme_type || 'General Scheme'}</span>
                <span className="scheme-active-badge">
                  <FiCheckCircle size={14} /> Active
                </span>
              </div>

              <h2 className="scheme-pro-title">{s.name}</h2>
              
              <div className="scheme-ministry">
                <FiBriefcase size={14} /> {s.ministry || 'Government of India'}
              </div>

              <p className="scheme-pro-desc">
                {s.description ? (s.description.length > 140 ? s.description.substring(0, 140) + '...' : s.description) : 'No description available for this scheme.'}
              </p>

              <div className="scheme-pro-details">
                <div className="detail-row">
                  <FiUsers className="detail-icon" />
                  <span><strong>Eligibility:</strong> {s.eligibility ? 'Specific requirements apply' : 'Open to eligible citizens'}</span>
                </div>
                {s.benefits && (
                  <div className="detail-row">
                    <FiDollarSign className="detail-icon" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <strong>Benefits:</strong> {s.benefits.replace(/\n/g, ', ')}
                    </span>
                  </div>
                )}
                <div className="detail-row">
                  <FiCalendar className="detail-icon" />
                  <span><strong>Last Date:</strong> {s.last_date || 'Ongoing / No strict deadline'}</span>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="btn-sm-outline" 
                  onClick={() => navigate(`/admin/schemes`)}
                  title="Edit this scheme"
                >
                  <FiEdit3 /> Manage
                </button>
                {s.apply_link ? (
                  <a href={s.apply_link} target="_blank" rel="noreferrer" className="btn-sm-primary">
                    <FiExternalLink /> Visit Official Portal
                  </a>
                ) : (
                  <button className="btn-sm-primary" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                    <FiExternalLink /> No Portal Link
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
