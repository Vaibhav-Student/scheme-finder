import { useState, useEffect } from 'react';
import { FiUsers, FiSearch, FiSlash, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/LoadingSpinner';
import './Admin.css';

export default function ViewUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const url = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/users';
    try {
      console.log('Fetching users from:', url);
      const res = await fetch(url);
      let data = [];
      try {
        data = await res.json();
      } catch (e) {
        throw new Error(`HTTP ${res.status}`);
      }
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to load users: ${err.message}. (Requested URL: ${url})`);
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleSuspend = async (id, currentStatus) => {
    const actionStr = currentStatus ? 'reactivate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${actionStr} this user?`)) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${id}/suspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspend: !currentStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const filtered = users.filter((u) => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Loading users directory..." />;

  return (
    <div className="admin-container container animate-fade-in" role="main" aria-label="User Directory">
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">User Directory</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>
          Manage registered users and control account access.
        </p>
      </header>

      <div className="search-wrapper" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
        <div className="search-bar" style={{ position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="search" className="input-field" style={{ paddingLeft: 46, width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            placeholder="Search by username or email..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search users"
          />
        </div>
      </div>

      <div className="table-wrapper card">
        <table className="data-table" aria-label="Users list">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Joined Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td style={{ color: '#64748b' }}>#{u.id}</td>
                <td style={{ fontWeight: 600, color: '#1e293b' }}>{u.username}</td>
                <td>{u.email}</td>
                <td>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                <td>
                  <span className={u.is_suspended === 1 ? 'scheme-inactive' : 'scheme-active'}>
                    {u.is_suspended === 1 ? 'Suspended' : 'Active'}
                  </span>
                </td>
                <td>
                  {u.is_suspended === 1 ? (
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleToggleSuspend(u.id, true)}
                    >
                      <FiCheckCircle size={14} /> Reactivate
                    </button>
                  ) : (
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleToggleSuspend(u.id, false)}
                    >
                      <FiSlash size={14} /> Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No users found matching your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
