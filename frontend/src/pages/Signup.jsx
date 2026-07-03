import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  FiEye, FiEyeOff, FiArrowRight,
  FiUser, FiLock, FiMail, FiAlertCircle,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import './Auth.css';

/* ── Password Strength ──────────────────────────── */
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: '', cls: '' };
  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd))    score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score: 1, label: 'Weak',   cls: 'weak'   };
  if (score === 2) return { score: 2, label: 'Fair',   cls: 'fair'   };
  if (score === 3) return { score: 3, label: 'Good',   cls: 'good'   };
  return             { score: 4, label: 'Strong', cls: 'strong' };
}

function StrengthBar({ password }) {
  const { score, label, cls } = useMemo(() => getStrength(password), [password]);
  if (!password) return null;

  const barClasses = ['', '', '', ''].map((_, i) => {
    const activeCls =
      cls === 'weak'   ? 'active-weak'   :
      cls === 'fair'   ? 'active-fair'   :
      cls === 'good'   ? 'active-good'   :
      'active-strong';
    return `strength-bar ${i < score ? activeCls : ''}`;
  });

  return (
    <div className="password-strength">
      <div className="strength-bars">
        {barClasses.map((c, i) => <div key={i} className={c}></div>)}
      </div>
      <span className={`strength-label ${cls}`}>{label} password</span>
    </div>
  );
}

/* ── Signup Page ─────────────────────────────────── */
export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.username.trim()) errs.username = 'Username is required';
    else if (formData.username.trim().length < 3) errs.username = 'At least 3 characters';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Invalid email format';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'At least 6 characters';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await signup(formData.email, formData.username, formData.password);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-noise"></div>

      <main className="auth-main">
        <div className="auth-container" style={{ maxWidth: '34rem' }}>
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
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Join Scheme Finder — it's free</p>
            </div>

            <div className="auth-divider"></div>

            {/* Form */}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>

              {/* Username + Email row */}
              <div className="auth-grid-2">
                {/* Username */}
                <div className="input-group">
                  <label htmlFor="signup-username">Username</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon"><FiUser size={16} /></span>
                    <input
                      id="signup-username"
                      name="username"
                      type="text"
                      className={`input-field${errors.username ? ' input-error' : ''}`}
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={handleChange}
                      autoComplete="username"
                    />
                  </div>
                  {errors.username && (
                    <span className="field-error">
                      <FiAlertCircle size={12} />{errors.username}
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className="input-group">
                  <label htmlFor="signup-email">Email Address</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon"><FiMail size={16} /></span>
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      className={`input-field${errors.email ? ' input-error' : ''}`}
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <span className="field-error">
                      <FiAlertCircle size={12} />{errors.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="input-group">
                <label htmlFor="signup-password">Password</label>
                <div className="input-icon-wrapper password-input-container">
                  <span className="input-icon"><FiLock size={16} /></span>
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`input-field${errors.password ? ' input-error' : ''}`}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
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
                {errors.password && (
                  <span className="field-error">
                    <FiAlertCircle size={12} />{errors.password}
                  </span>
                )}
                <StrengthBar password={formData.password} />
              </div>

              {/* Confirm Password */}
              <div className="input-group">
                <label htmlFor="signup-confirm-password">Confirm Password</label>
                <div className="input-icon-wrapper password-input-container">
                  <span className="input-icon"><FiLock size={16} /></span>
                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`input-field${errors.confirmPassword ? ' input-error' : ''}`}
                    placeholder="Repeat your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="field-error">
                    <FiAlertCircle size={12} />{errors.confirmPassword}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading
                  ? <><span className="btn-spinner"></span><span>Creating account…</span></>
                  : <><span>Create Account</span><FiArrowRight size={17} /></>
                }
              </button>
            </form>

            {/* Footer */}
            <div className="auth-switch">
              Already have an account?&nbsp;<Link to="/login">Sign In</Link>
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
