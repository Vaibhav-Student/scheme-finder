import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import './Auth.css';

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
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const firstError = Object.values(data).flat()[0];
        toast.error(firstError || 'Registration failed.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-noise"></div>
      
      <main className="auth-main">
        <div className="auth-container" style={{ maxWidth: '32rem' }}>
          <div className="auth-container-glow"></div>
          
          <div className="auth-card">
            {/* Header */}
            <div className="auth-header">
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Join Scheme Finder today</p>
            </div>

            {/* Form */}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Username Input */}
                <div className="input-group">
                  <label htmlFor="signup-username">Username</label>
                  <input
                    id="signup-username"
                    name="username"
                    type="text"
                    className={`input-field`}
                    style={errors.username ? { borderColor: '#ba1a1a' } : {}}
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                    autoComplete="username"
                  />
                  {errors.username && <span style={{ color: '#ba1a1a', fontSize: '12px' }}>{errors.username}</span>}
                </div>

                {/* Email Input */}
                <div className="input-group">
                  <label htmlFor="signup-email">Email Address</label>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    className={`input-field`}
                    style={errors.email ? { borderColor: '#ba1a1a' } : {}}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                  {errors.email && <span style={{ color: '#ba1a1a', fontSize: '12px' }}>{errors.email}</span>}
                </div>
              </div>

              {/* Password Input */}
              <div className="input-group">
                <label htmlFor="signup-password">Password</label>
                <div className="password-input-container">
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`input-field`}
                    style={errors.password ? { borderColor: '#ba1a1a', paddingRight: '2.5rem' } : { paddingRight: '2.5rem' }}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
                {errors.password && <span style={{ color: '#ba1a1a', fontSize: '12px' }}>{errors.password}</span>}
              </div>

              {/* Confirm Password Input */}
              <div className="input-group">
                <label htmlFor="signup-confirm-password">Confirm Password</label>
                <div className="password-input-container">
                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`input-field`}
                    style={errors.confirmPassword ? { borderColor: '#ba1a1a', paddingRight: '2.5rem' } : { paddingRight: '2.5rem' }}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && <span style={{ color: '#ba1a1a', fontSize: '12px' }}>{errors.confirmPassword}</span>}
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                <span>{loading ? 'Creating account...' : 'Sign Up'}</span>
                {!loading && <FiArrowRight size={18} />}
              </button>
            </form>

            {/* Footer Text */}
            <div className="auth-switch">
              Already have an account? <Link to="/login">Sign In</Link>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative background elements */}
      <div className="auth-bg-orbs">
        <div className="auth-bg-orb-1"></div>
        <div className="auth-bg-orb-2"></div>
      </div>
    </div>
  );
}
