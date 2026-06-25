import { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiFilter, FiVolume2, FiInbox, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import { staticSchemes, checkEligibility } from '../data/staticSchemes';
import SchemeCard from '../components/SchemeCard';
import TextToSpeech from '../components/TextToSpeech';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const SCHEME_TYPES = ['All', 'Scholarship', 'Pension', 'Assistive Device', 'Employment', 'Skill Training', 'Financial Assistance', 'Other'];

export default function Dashboard() {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTTS, setShowTTS] = useState(false);

  useEffect(() => {
    const fetchSchemes = () => {
      try {
        const profileKey = user ? `demoUserProfile_${user.id}` : 'demoUserProfile';
        const storedProfile = localStorage.getItem(profileKey);
        if (!storedProfile) {
          setError('profile_incomplete');
        } else {
          const profile = JSON.parse(storedProfile);
          // Filter static and custom schemes based on the profile
          const customSchemes = JSON.parse(localStorage.getItem('demoCustomSchemes') || '[]');
          const allSchemes = [...staticSchemes, ...customSchemes];
          const eligibleSchemes = allSchemes.filter(scheme => checkEligibility(profile, scheme));
          setSchemes(eligibleSchemes);
        }
      } catch (err) {
        setError('Failed to load schemes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    // Add an artificial delay to simulate loading for the demo
    setTimeout(fetchSchemes, 800);
  }, [user]);

  const filtered = useMemo(() => {
    let result = schemes;
    if (activeFilter !== 'All') {
      result = result.filter((s) => s.scheme_type === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.benefits && s.benefits.toLowerCase().includes(q)) ||
          (s.ministry && s.ministry.toLowerCase().includes(q))
      );
    }
    return result;
  }, [schemes, activeFilter, searchQuery]);

  const ttsText = useMemo(
    () =>
      filtered.length > 0
        ? `You are eligible for ${filtered.length} schemes. ${filtered.map((s, i) => `Scheme ${i + 1}: ${s.name}. Benefits: ${s.benefits}`).join('. ')}`
        : 'No eligible schemes found.',
    [filtered]
  );

  if (loading) return <LoadingSpinner message="Finding your eligible schemes..." />;

  if (error === 'profile_incomplete') {
    return (
      <div className="dashboard-container">
        <div className="empty-state card">
          <div className="empty-state-icon" aria-hidden="true">📋</div>
          <h2 className="empty-state-title">Complete Your Profile First</h2>
          <p className="empty-state-text">Please fill out your eligibility form so we can find matching government schemes for you.</p>
          <a href="/form" className="btn btn-primary btn-lg mt-4">Fill Eligibility Form</a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="empty-state card">
          <div className="empty-state-icon" aria-hidden="true">⚠️</div>
          <h2 className="empty-state-title">Something went wrong</h2>
          <p className="empty-state-text">{error}</p>
          <button className="btn btn-primary mt-4" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" role="main" aria-label="Eligible Schemes Dashboard">
      
      {/* Dashboard Header section */}
      <header className="page-header">
        <h1 className="page-title">
          Dashboard
          {schemes.length > 0 && (
            <span className="count-badge" aria-label={`${schemes.length} schemes found`}>
              {schemes.length}
            </span>
          )}
        </h1>
        <div className="header-actions">
          <button
            className={`btn btn-outline ${showTTS ? 'active' : ''}`}
            onClick={() => setShowTTS(!showTTS)}
            aria-label="Toggle text to speech"
          >
            <FiVolume2 size={18} />
            {showTTS ? 'Hide TTS' : 'Read Aloud'}
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="summary-cards grid grid-3">
        <div className="card summary-card">
          <div className="summary-icon-wrapper blue">
            <FiTrendingUp size={24} />
          </div>
          <div className="summary-info">
            <h3>{schemes.length}</h3>
            <p>Total Eligible</p>
          </div>
        </div>
        <div className="card summary-card">
          <div className="summary-icon-wrapper green">
            <FiCheckCircle size={24} />
          </div>
          <div className="summary-info">
            <h3>Active</h3>
            <p>Profile Status</p>
          </div>
        </div>
      </div>

      {showTTS && (
        <div className="tts-panel card animate-slide-up">
          <TextToSpeech text={ttsText} />
        </div>
      )}

      {/* Filters and Search */}
      <div className="dashboard-controls card-static">
        <div className="search-bar">
          <FiSearch className="search-bar-icon" size={18} aria-hidden="true" />
          <input
            type="search"
            className="input-field"
            placeholder="Search schemes by name, benefits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search eligible schemes"
          />
        </div>

        <div className="filter-scroll" role="tablist" aria-label="Filter by scheme type">
          {SCHEME_TYPES.map((type) => (
            <button
              key={type}
              className={`filter-chip ${activeFilter === type ? 'active' : ''}`}
              onClick={() => setActiveFilter(type)}
              role="tab"
              aria-selected={activeFilter === type}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes List */}
      <div className="dashboard-content mt-6">
        {filtered.length === 0 ? (
          <div className="empty-state card animate-fade-in">
            <div className="empty-state-icon" aria-hidden="true">
              <FiInbox size={48} />
            </div>
            <h2 className="empty-state-title">No Schemes Found</h2>
            <p className="empty-state-text">
              {schemes.length === 0
                ? "Based on your profile, we couldn't find matching schemes right now. New schemes are added regularly — check back soon!"
                : 'No schemes match your current filter. Try adjusting your search or filter.'}
            </p>
            {schemes.length === 0 && (
              <a href="/form" className="btn btn-primary mt-4">Update Your Profile</a>
            )}
          </div>
        ) : (
          <div className="schemes-grid grid grid-2" role="list" aria-label="List of eligible schemes">
            {filtered.map((scheme, index) => (
              <div key={scheme.id} role="listitem" className={`stagger-${(index % 6) + 1} animate-slide-up`} style={{ animationFillMode: 'both' }}>
                <SchemeCard scheme={scheme} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
