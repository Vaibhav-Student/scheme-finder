import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  FiEye, FiEyeOff, FiArrowRight,
  FiUser, FiLock, FiAlertCircle, FiMail,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Toggle between "User" and "Admin" login modes
  const [mode, setMode] = useState('user'); // 'user' | 'admin'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'user' && !email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (mode === 'admin' && !username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const credential = mode === 'admin' ? username : email;
      const response = await login(credential, password);
      if (response.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-noise"></div>

      <main className="auth-main">
        <div className="auth-container">
          <div className="auth-container-glow"></div>

          <div className="auth-card">
            {/* Brand Badge */}
            <div className="auth-brand-badge">
              <div className="auth-brand-icon">
                <HiSparkles />
              </div>
            </div>

            {/* Header */}
            <div className="auth-header">
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Sign in to manage your schemes</p>
            </div>

            {/* Mode toggle tabs */}
            <div style={{
              display: 'flex', gap: '0.5rem', marginBottom: '1.25rem',
              background: 'var(--bg-primary)', borderRadius: '0.6rem',
              padding: '0.3rem', border: '1px solid var(--border-primary)'
            }}>
              <button
                type="button"
                onClick={() => { setMode('user'); setError(''); }}
                style={{
                  flex: 1, padding: '0.55rem 0', borderRadius: '0.45rem',
                  border: 'none', cursor: 'pointer', fontWeight: 600,
                  fontSize: '0.82rem', transition: 'all 0.2s',
                  background: mode === 'user'
                    ? 'linear-gradient(135deg, #6366F1, #818cf8)'
                    : 'transparent',
                  color: mode === 'user' ? '#fff' : 'var(--text-muted)',
                }}
              >
                User Login
              </button>
              <button
                type="button"
                onClick={() => { setMode('admin'); setError(''); }}
                style={{
                  flex: 1, padding: '0.55rem 0', borderRadius: '0.45rem',
                  border: 'none', cursor: 'pointer', fontWeight: 600,
                  fontSize: '0.82rem', transition: 'all 0.2s',
                  background: mode === 'admin'
                    ? 'linear-gradient(135deg, #6366F1, #818cf8)'
                    : 'transparent',
                  color: mode === 'admin' ? '#fff' : 'var(--text-muted)',
                }}
              >
                Admin Login
              </button>
            </div>

            <div className="auth-divider"></div>

            {/* Error Alert */}
            {error && (
              <div className="auth-error" role="alert">
                <FiAlertCircle className="auth-error-icon" size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>

              {/* Email input (user mode) */}
              {mode === 'user' && (
                <div className="input-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <FiMail size={16} />
                    </span>
                    <input
                      id="email"
                      type="email"
                      className="input-field"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Username input (admin mode) */}
              {mode === 'admin' && (
                <div className="input-group">
                  <label htmlFor="username">Username</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <FiUser size={16} />
                    </span>
                    <input
                      id="username"
                      type="text"
                      className="input-field"
                      placeholder="Enter admin username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password Input */}
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="input-icon-wrapper password-input-container">
                  <span className="input-icon">
                    <FiLock size={16} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="auth-options">
                <label className="login-checkbox">
                  <input type="checkbox" />
                  <span className="login-checkbox-text">Remember me</span>
                </label>
                <a href="#" className="auth-forgot-link">Forgot Password?</a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading
                  ? <><span className="btn-spinner"></span><span>Signing in…</span></>
                  : <><span>Sign In</span><FiArrowRight size={17} /></>
                }
              </button>
            </form>

            {/* Footer */}
            <div className="auth-switch">
              Don't have an account?&nbsp;<Link to="/signup">Create one free</Link>
            </div>
          </div>
        </div>
      </main>

      {/* Ambient background orbs */}
      <div className="auth-bg-orbs">
        <div className="auth-bg-orb-1"></div>
        <div className="auth-bg-orb-2"></div>
        <div className="auth-bg-orb-3"></div>
      </div>
    </div>
  );
}
