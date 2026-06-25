import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiCpu, FiExternalLink, FiClock, FiGlobe, FiCheckCircle, FiShield, FiAlertTriangle, FiLink, FiX, FiFileText, FiUsers, FiDollarSign, FiBookOpen, FiArrowRight, FiDatabase } from 'react-icons/fi';
import { fetchRecentNews, analyzeHeadlineWithAI } from '../../api/aiAnalyzer';
import { toast } from 'react-toastify';
import './AIAssistant.css';

const SCAN_PHASES = [
  { label: 'Connecting to news sources...', icon: '🌐' },
  { label: 'Fetching latest government headlines...', icon: '📰' },
  { label: 'Running AI analysis on articles...', icon: '🤖' },
  { label: 'Verifying sources & checking authenticity...', icon: '🔍' },
  { label: 'Finalizing results...', icon: '✅' },
];

export default function AIAssistant() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [scanPercent, setScanPercent] = useState(0);
  const [scanPhase, setScanPhase] = useState(0);
  const [scanStats, setScanStats] = useState({ total: 0, schemes: 0 });
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearching) {
      intervalRef.current = setInterval(() => {
        setScanPercent((prev) => (prev < 95 ? prev + Math.random() * 2 : prev));
      }, 200);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isSearching]);

  const handleSearch = async () => {
    setIsSearching(true);
    setResults([]);
    setHasSearched(false);
    setScanPercent(0);
    setScanPhase(0);
    setScanStats({ total: 0, schemes: 0 });

    try {
      setScanPhase(0);
      await sleep(400);
      setScanPhase(1);
      setScanPercent(10);

      const articles = await fetchRecentNews();
      setScanPercent(25);
      setScanPhase(2);

      const analyses = await Promise.all(articles.map((a) => analyzeHeadlineWithAI(a)));
      setScanPercent(75);
      setScanPhase(3);
      await sleep(300);

      const schemeResults = [];
      for (let i = 0; i < articles.length; i++) {
        if (analyses[i].scheme_related === 'Yes') {
          schemeResults.push({ ...articles[i], analysis: analyses[i] });
        }
      }
      schemeResults.sort((a, b) => b.analysis.confidence - a.analysis.confidence);

      setScanPercent(95);
      setScanPhase(4);
      setScanStats({ total: articles.length, schemes: schemeResults.length });
      await sleep(500);
      setScanPercent(100);
      await sleep(600);

      setResults(schemeResults);
      setHasSearched(true);

      if (schemeResults.length > 0) {
        toast.success(`Found ${schemeResults.length} scheme(s) from ${articles.length} articles!`);
      } else {
        toast.info(`Scanned ${articles.length} articles — no new schemes detected.`);
      }
    } catch (error) {
      console.error('[AI Assistant] Error:', error);
      toast.error('Scan failed. Please try again.');
    } finally {
      setIsSearching(false);
      setScanPercent(0);
    }
  };

  // --- REDIRECT TO SCRAPER ---
  const handleRedirectToScraper = (item) => {
    const schemeName = item.analysis.suggested_name || item.title;
    const portalUrl = item.analysis.verification?.officialPortal?.url || item.url || '';
    navigate(`/admin/add-scheme?mode=scrape&q=${encodeURIComponent(schemeName)}&url=${encodeURIComponent(portalUrl)}`);
  };

  const handleApprove = async (index) => {
    const item = results[index];
    const name = item.analysis.suggested_name || item.title;
    
    try {
      await fetch('http://localhost:5000/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          source_url: item.url,
          source_name: item.source,
          ai_confidence: item.analysis.confidence,
          ai_reason: item.analysis.reason,
          verification_status: item.analysis.verification?.status || 'unknown',
          official_portal: item.analysis.verification?.officialPortal?.url || null,
          headline: item.title,
          content: item.content,
        })
      });
      toast.success(`"${name}" added to review queue!`);
      setResults((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      toast.error('Failed to save to database');
    }
  };

  const handleReject = (index) => {
    toast.info('Dismissed.');
    setResults((prev) => prev.filter((_, i) => i !== index));
  };

  const getConfidenceColor = (s) => (s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444');
  const formatDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return ''; }
  };
  const getVBadgeClass = (s) => {
    switch (s) {
      case 'verified': return 'vbadge-verified';
      case 'likely_genuine': return 'vbadge-likely';
      case 'unverified': return 'vbadge-unverified';
      case 'suspicious': return 'vbadge-suspicious';
      default: return 'vbadge-unverified';
    }
  };

  return (
    <div className="ai-assistant-container container">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-title-wrap">
          <h1><FiCpu /> AI Scheme Discoverer</h1>
          <p>Scans government news, verifies sources, scrapes official portals for full scheme details — with fake-news detection.</p>
        </div>
        <button className="ai-btn-scan" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? 'Scanning...' : <><FiSearch /> Scan for New Schemes</>}
        </button>
      </div>

      {/* ═══ SCANNING OVERLAY ═══ */}
      {isSearching && (
        <div className="scan-overlay">
          <div className="scan-card">
            <div className="scan-circle-wrap">
              <svg className="scan-circle" viewBox="0 0 120 120">
                <circle className="scan-circle-bg" cx="60" cy="60" r="52" />
                <circle className="scan-circle-fill" cx="60" cy="60" r="52"
                  style={{ strokeDashoffset: 327 - (327 * Math.min(scanPercent, 100)) / 100 }} />
              </svg>
              <span className="scan-percent">{Math.round(scanPercent)}%</span>
            </div>
            <div className="scan-phases">
              {SCAN_PHASES.map((phase, i) => (
                <div key={i} className={`scan-phase-item ${i < scanPhase ? 'done' : ''} ${i === scanPhase ? 'active' : ''}`}>
                  <span className="scan-phase-icon">{i < scanPhase ? <FiCheckCircle /> : phase.icon}</span>
                  <span className="scan-phase-label">{phase.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ EMPTY STATE ═══ */}
      {!isSearching && hasSearched && results.length === 0 && (
        <div className="ai-empty-state">
          <FiShield size={56} />
          <h2>No New Schemes Found</h2>
          <p>Scanned {scanStats.total} articles — none matched a genuine government scheme.<br />Try scanning again later.</p>
        </div>
      )}

      {/* ═══ RESULTS ═══ */}
      {!isSearching && results.length > 0 && (
        <>
          <div className="ai-summary-bar">
            <span className="ai-summary-count ai-summary-scheme">🏛️ {results.length} Scheme{results.length > 1 ? 's' : ''} Found</span>
            <span className="ai-summary-detail">from {scanStats.total} articles scanned</span>
          </div>

          <div className="ai-results-grid">
            {results.map((item, idx) => {
              const { analysis } = item;
              const v = analysis.verification || {};

              return (
                <div className="ai-card ai-card-scheme" key={idx}>
                  <div className={`verification-badge ${getVBadgeClass(v.status)}`}>{v.statusLabel || '⚠️ Unverified'}</div>

                  <div className="ai-card-meta">
                    <span className="ai-card-source"><FiGlobe size={12} /> {item.source || 'Unknown'}</span>
                    {item.publishedAt && <span className="ai-card-date"><FiClock size={12} /> {formatDate(item.publishedAt)}</span>}
                  </div>

                  <div className="source-detail-box">
                    <div className="source-detail-label">📡 News Source</div>
                    <div className="source-detail-row">
                      <span className="source-domain">{v.sourceDomain || 'N/A'}</span>
                      <a href={item.url} target="_blank" rel="noreferrer" className="source-link"><FiExternalLink size={11} /> View Article</a>
                    </div>
                  </div>

                  {analysis.suggested_name && <div className="ai-scheme-name">🏛️ {analysis.suggested_name}</div>}
                  <h3 className="ai-card-title">{item.title}</h3>
                  {item.content && <p className="ai-card-content">{item.content.substring(0, 150)}...</p>}

                  <div className="ai-confidence-row">
                    <span className="ai-confidence-label">AI Confidence: <strong>{analysis.confidence}%</strong></span>
                    <div className="ai-confidence-bar">
                      <div className="ai-confidence-fill" style={{ width: `${analysis.confidence}%`, backgroundColor: getConfidenceColor(analysis.confidence) }} />
                    </div>
                  </div>

                  <div className="ai-reason">"{analysis.reason}"</div>

                  {/* Verification box */}
                  <div className={`verification-detail-box ${getVBadgeClass(v.status)}`}>
                    <div className="vd-header">
                      {v.status === 'verified' && <FiShield size={14} />}
                      {v.status === 'likely_genuine' && <FiCheckCircle size={14} />}
                      {(v.status === 'unverified' || v.status === 'suspicious') && <FiAlertTriangle size={14} />}
                      <span>Source Verification</span>
                    </div>
                    <p className="vd-detail">{v.statusDetail}</p>
                    {v.officialPortal && (
                      <a href={v.officialPortal.url} target="_blank" rel="noreferrer" className="official-portal-link">
                        <FiLink size={13} />
                        <span><strong>Verify on:</strong> {v.officialPortal.name}<br /><small>{v.officialPortal.ministry}</small></span>
                        <FiExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {/* SEND TO SCRAPER button */}
                  <button className="ai-btn-details" onClick={() => handleRedirectToScraper(item)}>
                    <FiDatabase size={14} /> Send to Auto Scraper
                  </button>

                  {/* Actions */}
                  {analysis.confidence > 70 && (
                    <div className="ai-actions">
                      <button className="ai-btn-approve" onClick={() => handleApprove(idx)}
                        disabled={v.status === 'suspicious'}
                        title={v.status === 'suspicious' ? 'Cannot approve suspicious sources' : ''}>
                        ✓ Add to Review Queue
                      </button>
                      <button className="ai-btn-reject" onClick={() => handleReject(idx)}>✕ Dismiss</button>
                    </div>
                  )}
                  {v.status === 'suspicious' && analysis.confidence > 70 && (
                    <p className="suspicious-warn">⚠️ Suspicious source — verify manually before approving.</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}


    </div>
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
