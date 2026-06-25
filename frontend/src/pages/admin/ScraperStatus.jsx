import { useState, useEffect, useCallback } from 'react';
import { FiPlay, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import './Admin.css';

export default function ScraperStatus() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const { data } = await API.get('/scraper/logs/');
      setLogs(Array.isArray(data) ? data : data.results || []);
    } catch { /* silently handle */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const triggerScrape = async () => {
    setTriggering(true);
    try {
      await API.post('/scraper/trigger/');
      toast.success('Scrape job triggered successfully');
      setTimeout(fetchLogs, 2000);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to trigger scrape');
    }
    setTriggering(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'status-success';
      case 'FAILED': return 'status-error';
      case 'RUNNING': return 'status-warning';
      default: return '';
    }
  };

  if (loading) return <LoadingSpinner message="Loading scraper status..." />;

  return (
    <div className="admin-container container" role="main" aria-label="Scraper Status">
      <h1 className="admin-title">Scraper Status</h1>

      <div className="actions-row" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <button
          className="btn btn-primary action-btn"
          onClick={triggerScrape}
          disabled={triggering}
          id="trigger-scrape-btn"
        >
          <FiPlay size={18} />
          {triggering ? 'Triggering...' : 'Trigger Scrape'}
        </button>
        <button
          className="btn btn-outline action-btn"
          onClick={fetchLogs}
          id="refresh-logs-btn"
        >
          <FiRefreshCw size={18} /> Refresh
        </button>
        <label className="active-toggle" style={{ marginLeft: 'auto' }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          Auto-refresh (10s)
        </label>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon" aria-hidden="true">🔍</div>
          <h2>No Scrape Logs</h2>
          <p>No scraping jobs have been run yet. Click "Trigger Scrape" to start one.</p>
        </div>
      ) : (
        <div className="table-wrapper card">
          <table className="data-table" aria-label="Scrape logs">
            <thead>
              <tr>
                <th>Source</th>
                <th>Status</th>
                <th>Schemes Found</th>
                <th>Schemes Updated</th>
                <th>Started</th>
                <th>Completed</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.source_name}</td>
                  <td><span className={`status-badge ${getStatusColor(log.status)}`}>{log.status}</span></td>
                  <td>{log.schemes_found}</td>
                  <td>{log.schemes_updated}</td>
                  <td>{new Date(log.started_at).toLocaleString('en-IN')}</td>
                  <td>{log.completed_at ? new Date(log.completed_at).toLocaleString('en-IN') : '—'}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.error_message || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
