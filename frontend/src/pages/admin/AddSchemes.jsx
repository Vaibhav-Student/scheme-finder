import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiDatabase, FiEdit3, FiPlay, FiCheckCircle, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { scrapeSchemeDetails } from '../../api/schemeScraper';
import './Admin.css';
import './AddSchemes.css';

const SCHEME_TYPES = ['Scholarship', 'Pension', 'Assistive Device', 'Employment', 'Skill Training', 'Financial Assistance', 'Other'];
const DISABILITY_TYPES = ['Locomotor', 'Visual', 'Hearing', 'Intellectual', 'Mental Illness', 'Multiple Disabilities'];
const CATEGORIES = ['SC', 'ST', 'OBC', 'General'];
const EDUCATION_LEVELS = ['Pre-Primary', 'Primary', 'Secondary', 'Higher Secondary', 'Graduate', 'Post-Graduate'];

export default function AddSchemes() {
  const location = useLocation();
  const [activeMode, setActiveMode] = useState('manual'); // 'manual' or 'scrape'
  const [loading, setLoading] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeQuery, setScrapeQuery] = useState('');
  const [scrapedData, setScrapedData] = useState(null);
  const [scrapeError, setScrapeError] = useState(null);

  // Manual Form State
  const [form, setForm] = useState({
    name: '', description: '', benefits: '', required_documents: '',
    apply_link: '', last_date: '', ministry: '', scheme_type: 'Scholarship',
    is_active: true,
    eligibility: {
      min_age: '', max_age: '', min_disability_pct: 40, max_family_income: '',
      disability_types: [], states: [], categories: [], education_levels: []
    }
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    if (mode === 'scrape') {
      setActiveMode('scrape');
    }
    const q = params.get('q');
    const url = params.get('url');
    if (q) setScrapeQuery(q);
    if (url) setScrapeUrl(url);
  }, [location.search]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch((import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/schemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          scheme_type: form.scheme_type || 'General Scheme',
          is_active: form.is_active !== false,
        })
      });

      toast.success('Scheme saved successfully to Database!');
      setForm({
        ...form, name: '', description: '', benefits: '', apply_link: ''
      });
    } catch (err) {
      toast.error('Failed to save scheme. Please check database connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeTrigger = async () => {
    setLoading(true);
    setScrapedData(null);
    setScrapeError(null);
    try {
      const details = await scrapeSchemeDetails(scrapeQuery || '', scrapeUrl);
      if (details && details.success) {
        setScrapedData(details);
        if (details.warning) {
          toast.warning('Scraped with warnings. Some data might be missing.');
        } else {
          toast.success('Successfully scraped scheme details!');
        }
      } else {
        setScrapeError(details?.errorDetail || "Failed to scrape the website.");
        toast.error('Scraping failed. See error details.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Scraping failed with unexpected error.');
      setScrapeError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferToForm = () => {
    if (!scrapedData) return;
    setForm(prev => ({
      ...prev,
      name: scrapedData.name || '',
      description: scrapedData.description || '',
      benefits: Array.isArray(scrapedData.benefits) ? scrapedData.benefits.join('\n') : (scrapedData.benefits || ''),
      required_documents: Array.isArray(scrapedData.documents) ? scrapedData.documents.join('\n') : (scrapedData.documents || ''),
      apply_link: scrapedData.portalUrl || scrapedData.scrapedFrom || scrapeUrl || '',
      ministry: scrapedData.ministry || '',
    }));
    setActiveMode('manual');
    toast.info('Data transferred to manual form. Please review and save.');
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateEligibility = (field, value) =>
    setForm((prev) => ({ ...prev, eligibility: { ...prev.eligibility, [field]: value } }));

  const toggleArrayItem = (field, item) => {
    const arr = form.eligibility[field] || [];
    const updated = arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
    updateEligibility(field, updated);
  };

  return (
    <div className="admin-container container" role="main" aria-label="Add Schemes">
      <header className="page-header">
        <h1 className="page-title">Add New Schemes</h1>
      </header>

      {/* Mode Selector */}
      <div className="mode-selector">
        <button
          className={`mode-btn ${activeMode === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveMode('manual')}
        >
          <FiEdit3 size={20} className="mode-icon" />
          <div className="mode-info">
            <h3>Manual Entry</h3>
            <p>Add a single scheme manually</p>
          </div>
          {activeMode === 'manual' && <FiCheckCircle className="mode-check" size={18} />}
        </button>

        <button
          className={`mode-btn ${activeMode === 'scrape' ? 'active' : ''}`}
          onClick={() => setActiveMode('scrape')}
        >
          <FiDatabase size={20} className="mode-icon" />
          <div className="mode-info">
            <h3>Automated Scraping</h3>
            <p>Fetch multiple schemes from external sources</p>
          </div>
          {activeMode === 'scrape' && <FiCheckCircle className="mode-check" size={18} />}
        </button>
      </div>

      <div className="card mt-6">
        {activeMode === 'manual' ? (
          <form className="add-scheme-form animate-fade-in" onSubmit={handleManualSubmit}>
            <h2 className="section-heading" style={{ marginBottom: 'var(--spacing-lg)' }}>Scheme Details</h2>
            
            <div className="form-row grid-2">
              <div className="input-group">
                <label>Scheme Name *</label>
                <input className="input-field" required value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="e.g. National Merit Scholarship" />
              </div>
              <div className="input-group">
                <label>Ministry / Department</label>
                <input className="input-field" value={form.ministry} onChange={(e) => updateField('ministry', e.target.value)} placeholder="e.g. Ministry of Education" />
              </div>
            </div>

            <div className="form-row grid-2">
              <div className="input-group">
                <label>Scheme Type</label>
                <select className="select-field" value={form.scheme_type} onChange={(e) => updateField('scheme_type', e.target.value)}>
                  {SCHEME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Application Deadline</label>
                <input type="date" className="input-field" value={form.last_date} onChange={(e) => updateField('last_date', e.target.value)} />
              </div>
            </div>

            <div className="input-group">
              <label>Description</label>
              <textarea className="input-field" rows={3} value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Brief description of the scheme..." />
            </div>

            <div className="input-group">
              <label>Benefits *</label>
              <textarea className="input-field" rows={2} required value={form.benefits} onChange={(e) => updateField('benefits', e.target.value)} placeholder="What does this scheme provide?" />
            </div>

            <div className="input-group">
              <label>Apply Link</label>
              <input className="input-field" value={form.apply_link} onChange={(e) => updateField('apply_link', e.target.value)} placeholder="https://" />
            </div>

            <h2 className="section-heading" style={{ marginTop: 'var(--spacing-2xl)', marginBottom: 'var(--spacing-lg)' }}>Eligibility Criteria</h2>
            
            <div className="form-row grid-2">
              <div className="input-group">
                <label>Min Age</label>
                <input type="number" className="input-field" value={form.eligibility.min_age} onChange={(e) => updateEligibility('min_age', e.target.value)} placeholder="e.g. 18" />
              </div>
              <div className="input-group">
                <label>Max Age</label>
                <input type="number" className="input-field" value={form.eligibility.max_age} onChange={(e) => updateEligibility('max_age', e.target.value)} placeholder="e.g. 60" />
              </div>
            </div>

            <div className="form-row grid-2">
              <div className="input-group">
                <label>Max Family Income (₹)</label>
                <input type="number" className="input-field" value={form.eligibility.max_family_income} onChange={(e) => updateEligibility('max_family_income', e.target.value)} placeholder="e.g. 250000" />
              </div>
              <div className="input-group">
                <label>Min Disability Percentage</label>
                <input type="number" className="input-field" value={form.eligibility.min_disability_pct} onChange={(e) => updateEligibility('min_disability_pct', e.target.value)} />
              </div>
            </div>

            <div className="grid-2 mt-4">
              <div className="input-group">
                <label>Categories (Select all applicable)</label>
                <div className="checkbox-grid">
                  {CATEGORIES.map((c) => (
                    <label key={c} className="active-toggle">
                      <input type="checkbox" checked={form.eligibility.categories?.includes(c)} onChange={() => toggleArrayItem('categories', c)} /> {c}
                    </label>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Education Levels</label>
                <div className="checkbox-grid">
                  {EDUCATION_LEVELS.map((el) => (
                    <label key={el} className="active-toggle">
                      <input type="checkbox" checked={form.eligibility.education_levels?.includes(el)} onChange={() => toggleArrayItem('education_levels', el)} /> {el}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-footer mt-6" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 'var(--spacing-xl)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? 'Saving...' : 'Save Scheme Manually'}
              </button>
            </div>
          </form>
        ) : (
          <div className="scrape-mode-view animate-fade-in" style={{ textAlign: 'center', padding: 'var(--spacing-3xl) 0' }}>
            <div className="empty-state-icon" style={{ color: 'var(--color-primary-raw)' }}>
              <FiDatabase size={64} />
            </div>
            <h2 className="section-heading" style={{ marginTop: 'var(--spacing-md)' }}>Automated Scheme Scraping</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto var(--spacing-xl)' }}>
              Extract scheme details automatically from official government portals or MyScheme.gov.in.
            </p>
            
            <div style={{ maxWidth: '400px', margin: '0 auto var(--spacing-xl)', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: '500' }}>Scheme Name (Optional)</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. PM Surya Ghar Yojana"
                value={scrapeQuery}
                onChange={(e) => setScrapeQuery(e.target.value)}
                style={{ marginBottom: '1rem' }}
              />

              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: '500' }}>Target Website URL</label>
              <input 
                type="url" 
                className="input-field" 
                placeholder="e.g. https://myscheme.gov.in"
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
              />
            </div>

            <button 
              className="btn btn-primary btn-lg" 
              onClick={handleScrapeTrigger}
              disabled={loading || (!scrapeUrl && !scrapeQuery)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
            >
              <FiPlay size={20} />
              {loading ? 'Scraping...' : 'Start Scraping Now'}
            </button>

            {scrapedData && (
              <div className="scraped-results animate-fade-in" style={{ marginTop: '2.5rem', textAlign: 'left', background: 'var(--bg-surface-solid)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', maxWidth: '500px', margin: '2.5rem auto 0' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <FiCheckCircle color="#10b981" /> Scraped Data Ready
                </h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  <p><strong>Name:</strong> {scrapedData.name}</p>
                  <p><strong>Ministry:</strong> {scrapedData.ministry}</p>
                  <p><strong>Description:</strong> {scrapedData.description?.substring(0, 120)}...</p>
                </div>
                
                <button 
                  className="btn btn-primary" 
                  onClick={handleTransferToForm}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}
                >
                  Review & Transfer to Form <FiArrowRight />
                </button>
              </div>
            )}

            {scrapeError && (
              <div className="scrape-error animate-fade-in" style={{ marginTop: '2.5rem', textAlign: 'left', background: '#fef2f2', padding: '1.5rem', borderRadius: '12px', border: '1px solid #fecaca', maxWidth: '500px', margin: '2.5rem auto 0' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c' }}>
                  <FiAlertCircle size={20} color="#ef4444" /> Scraping Failed
                </h3>
                <div style={{ fontSize: '0.9rem', color: '#7f1d1d', lineHeight: '1.6', marginBottom: '1rem' }}>
                  <p><strong>Reason:</strong> {scrapeError}</p>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#991b1b', fontStyle: 'italic' }}>
                  Note: State government websites often block automated tools or require human verification (CAPTCHA). Try switching to the <strong>Manual Entry</strong> tab.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
