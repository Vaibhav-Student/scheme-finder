import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiExternalLink, FiCalendar, FiCheckCircle, FiFileText, FiAward } from 'react-icons/fi';
import { staticSchemes } from '../data/staticSchemes';
import TextToSpeech from '../components/TextToSpeech';
import LoadingSpinner from '../components/LoadingSpinner';
import './SchemeDetail.css';

function getDaysRemaining(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function SchemeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTTS, setShowTTS] = useState(false);

  useEffect(() => {
    const fetchScheme = () => {
      const customSchemes = JSON.parse(localStorage.getItem('demoCustomSchemes') || '[]');
      const allSchemes = [...staticSchemes, ...customSchemes];
      const foundScheme = allSchemes.find(s => String(s.id) === String(id));
      if (foundScheme) {
        setScheme(foundScheme);
      } else {
        navigate('/dashboard');
      }
      setLoading(false);
    };
    
    const timer = setTimeout(fetchScheme, 400);
    return () => clearTimeout(timer);
  }, [id, navigate]);

  if (loading) return <LoadingSpinner message="Loading scheme details..." />;
  if (!scheme) return null;

  const daysLeft = getDaysRemaining(scheme.last_date);
  const documents = Array.isArray(scheme.required_documents) ? scheme.required_documents : [];
  const ttsText = `${scheme.name}. Benefits: ${scheme.benefits}. Ministry: ${scheme.ministry}. ${documents.length > 0 ? `Required documents: ${documents.join(', ')}` : ''}`;

  return (
    <div className="scheme-detail-container container" role="main">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <button className="btn-back" onClick={() => navigate(-1)} aria-label="Go back">
          <FiArrowLeft size={20} /> Back
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{scheme.name}</span>
      </nav>

      <article className="scheme-detail animate-fade-in">
        <header className="scheme-detail-header">
          <div className="scheme-header-top">
            <span className="badge badge-primary">{scheme.scheme_type || 'Scheme'}</span>
            {daysLeft !== null && daysLeft >= 0 && (
              <span className={`deadline-badge ${daysLeft <= 7 ? 'deadline-urgent' : 'deadline-normal'}`}>
                <FiCalendar size={14} />
                {daysLeft === 0 ? 'Last day to apply!' : `${daysLeft} days remaining`}
              </span>
            )}
          </div>
          <h1 className="scheme-detail-title">{scheme.name}</h1>
          <p className="scheme-detail-ministry">
            <FiAward size={16} aria-hidden="true" />
            {scheme.ministry}
          </p>
        </header>

        <button
          className="btn btn-outline tts-btn"
          onClick={() => setShowTTS(!showTTS)}
          aria-label="Toggle text to speech for scheme details"
          id="scheme-tts-toggle"
        >
          🔊 {showTTS ? 'Hide Reader' : 'Read Aloud'}
        </button>

        {showTTS && (
          <div className="tts-section card animate-slide-up">
            <TextToSpeech text={ttsText} />
          </div>
        )}

        <section className="benefits-card card" aria-label="Scheme benefits">
          <h2 className="section-title">
            <FiAward size={20} aria-hidden="true" />
            Benefits
          </h2>
          <p className="benefits-text">{scheme.benefits}</p>
        </section>

        {scheme.description && (
          <section className="description-section" aria-label="Scheme description">
            <h2 className="section-title">
              <FiFileText size={20} aria-hidden="true" />
              Description
            </h2>
            <p className="description-text">{scheme.description}</p>
          </section>
        )}

        {documents.length > 0 && (
          <section className="documents-section" aria-label="Required documents">
            <h2 className="section-title">
              <FiCheckCircle size={20} aria-hidden="true" />
              Required Documents
            </h2>
            <ul className="documents-list">
              {documents.map((doc, index) => (
                <li key={index} className="document-item">
                  <FiCheckCircle size={16} className="doc-icon" aria-hidden="true" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {scheme.last_date && (
          <section className="date-section" aria-label="Application deadline">
            <h2 className="section-title">
              <FiCalendar size={20} aria-hidden="true" />
              Application Deadline
            </h2>
            <p className="date-text">
              {new Date(scheme.last_date).toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
              {daysLeft !== null && daysLeft >= 0 && (
                <span className={`days-badge ${daysLeft <= 7 ? 'deadline-urgent' : ''}`}>
                  {daysLeft === 0 ? 'Today is the last day!' : `${daysLeft} days left`}
                </span>
              )}
            </p>
          </section>
        )}

        <div className="scheme-actions">
          {scheme.apply_link && (
            <a
              href={scheme.apply_link.startsWith('http') ? scheme.apply_link : `https://${scheme.apply_link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg apply-btn"
              id="apply-now-btn"
            >
              <FiExternalLink size={18} />
              Apply Now
            </a>
          )}
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        {scheme.source_url && (
          <p className="source-info">
            Source:{' '}
            <a href={scheme.source_url.startsWith('http') ? scheme.source_url : `https://${scheme.source_url}`} target="_blank" rel="noopener noreferrer">
              {scheme.source_url}
            </a>
          </p>
        )}
      </article>
    </div>
  );
}
