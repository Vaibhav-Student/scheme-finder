import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiTrash2, FiExternalLink, FiClock, FiGlobe, FiDatabase, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './ReviewSchemes.css';

export default function ReviewSchemes() {
  const [schemes, setSchemes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadSchemes();
  }, []);

  const loadSchemes = async () => {
    const url = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/review';
    try {
      console.log('Fetching review queue from:', url);
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSchemes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to load review queue: ${err.message}. (Requested URL: ${url})`);
      setSchemes([]);
    }
  };

  const handleSendToScraper = (item) => {
    const schemeName = item.name || item.headline;
    const url = item.official_portal || item.source_url || '';
    navigate(`/admin/add-scheme?mode=scrape&q=${encodeURIComponent(schemeName)}&url=${encodeURIComponent(url)}`);
  };

  const handleMarkResearched = async (id) => {
    const item = schemes.find(s => s.id === id);
    if (item) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const saveUrl = `${baseUrl}/api/schemes`;
      const deleteUrl = `${baseUrl}/api/review/${id}`;
      try {
        const saveRes = await fetch(saveUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name || item.headline,
            description: item.content,
            ministry: 'Government of India',
            apply_link: item.official_portal || item.source_url,
            is_active: true,
            scheme_type: 'General Scheme',
            benefits: 'Pending detailed review',
            eligibility: 'Pending detailed review',
            last_date: 'Ongoing'
          })
        });

        if (!saveRes.ok) {
          const errorData = await saveRes.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with ${saveRes.status} on save`);
        }

        // Delete from review queue
        const deleteRes = await fetch(deleteUrl, { method: 'DELETE' });
        if (!deleteRes.ok) {
          const errorData = await deleteRes.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with ${deleteRes.status} on queue delete`);
        }

        setSchemes(schemes.filter(s => s.id !== id));
        toast.success('Marked as done & added to Active Schemes Database!');
      } catch (err) {
        toast.error(`Database error: ${err.message}. (Requested URLs: ${saveUrl} / ${deleteUrl})`);
        console.error(err);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to discard this item?')) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const deleteUrl = `${baseUrl}/api/review/${id}`;
      try {
        const res = await fetch(deleteUrl, { method: 'DELETE' });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with ${res.status}`);
        }
        setSchemes(schemes.filter(s => s.id !== id));
        toast.info('Item discarded from queue.');
      } catch (err) {
        toast.error(`Failed to delete item: ${err.message}. (Requested URL: ${deleteUrl})`);
        console.error(err);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="review-container container animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Review Queue</h1>
        <p className="page-subtitle">Manage newly discovered schemes from the AI Assistant. Research, scrape, or discard them.</p>
      </header>

      {schemes.length === 0 ? (
        <div className="empty-state">
          <FiCheckCircle size={56} className="empty-icon" />
          <h2>All Caught Up!</h2>
          <p>There are no pending schemes in your review queue.</p>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/admin/ai-assistant')}>
            <FiSearch /> Find New Schemes
          </button>
        </div>
      ) : (
        <div className="review-grid">
          {schemes.map((item) => (
            <div key={item.id} className="review-card">
              <div className="review-card-header">
                <span className="source-badge">
                  <FiGlobe size={12} /> {item.source_name || 'Unknown Source'}
                </span>
                <span className="date-badge">
                  <FiClock size={12} /> {formatDate(item.submitted_at)}
                </span>
              </div>

              <h3 className="review-title">{item.headline}</h3>
              {item.name && item.name !== item.headline && (
                <div className="review-suggested-name">Suggested Name: {item.name}</div>
              )}
              
              <p className="review-content">{item.content?.substring(0, 150)}...</p>

              <div className="review-meta">
                <div className="meta-item">
                  <strong>AI Confidence:</strong> 
                  <span className={item.ai_confidence > 80 ? 'text-success' : 'text-warning'}>
                    {item.ai_confidence}%
                  </span>
                </div>
                <div className="meta-item">
                  <strong>Status:</strong> {item.verification_status}
                </div>
              </div>

              {item.official_portal ? (
                 <a href={item.official_portal} target="_blank" rel="noreferrer" className="portal-link">
                   <FiExternalLink size={12} /> Official Portal Link
                 </a>
              ) : (
                 <a href={item.source_url} target="_blank" rel="noreferrer" className="portal-link">
                   <FiExternalLink size={12} /> Source News Article
                 </a>
              )}

              <div className="review-actions">
                <button className="btn btn-primary w-full flex-center gap-sm" onClick={() => handleSendToScraper(item)}>
                  <FiDatabase /> Send to Auto Scraper
                </button>
                <div className="action-row">
                  <button className="btn btn-outline flex-1 flex-center gap-sm" onClick={() => handleMarkResearched(item.id)}>
                    <FiCheckCircle /> Mark Done
                  </button>
                  <button className="btn btn-danger flex-1 flex-center gap-sm" onClick={() => handleDelete(item.id)}>
                    <FiTrash2 /> Discard
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
