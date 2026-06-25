import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMapPin, FiHeart, FiBook, FiCheck, FiArrowRight } from 'react-icons/fi';
import './EligibilityForm.css';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const DISABILITY_TYPES = [
  'Locomotor', 'Visual', 'Hearing', 'Intellectual', 'Mental Illness', 'Multiple Disabilities',
];

const EDUCATION_LEVELS = [
  'Pre-Primary', 'Primary', 'Secondary', 'Higher Secondary', 'Graduate', 'Post-Graduate',
];

const CATEGORIES = ['General', 'SC', 'ST', 'OBC'];

const GENDERS = ['Male', 'Female', 'Other'];

const GENDER_TO_DISPLAY = { M: 'Male', F: 'Female', Other: 'Other' };
const GENDER_TO_BACKEND = { Male: 'M', Female: 'F', Other: 'Other' };

const SECTIONS = [
  { key: 'personal', icon: FiUser, label: 'Personal Info' },
  { key: 'disability', icon: FiHeart, label: 'Disability Details' },
  { key: 'location', icon: FiMapPin, label: 'Location' },
  { key: 'social', icon: FiUser, label: 'Social & Economic' },
  { key: 'education', icon: FiBook, label: 'Education' },
];

export default function EligibilityForm() {
  const navigate = useNavigate();
  const { fetchProfile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    disability: 'No',
    state: '',
    district: '',
    category: '',
    family_income: '',
    education_level: '',
    udid_number: '',
  });

  useEffect(() => {
    const loadProfile = () => {
      try {
        const profileKey = user ? `demoUserProfile_${user.id}` : 'demoUserProfile';
        const storedProfile = localStorage.getItem(profileKey);
        if (storedProfile) {
          const data = JSON.parse(storedProfile);
          setFormData({
            full_name: data.full_name || '',
            age: data.age || '',
            gender: GENDER_TO_DISPLAY[data.gender] || data.gender || '',
            disability: data.disability || 'No',
            state: data.state || '',
            district: data.district || '',
            category: data.category || '',
            family_income: data.family_income || '',
            education_level: data.education_level || '',
            udid_number: data.udid_number || '',
          });
        }
      } catch {
        /* profile not filled yet, use defaults */
      }
      setInitialLoading(false);
    };
    loadProfile();
  }, [user]);

  const completedSections = () => {
    let count = 0;
    if (formData.full_name && formData.age && formData.gender) count++;
    if (formData.disability) count++;
    if (formData.state) count++;
    if (formData.category) count++;
    if (formData.education_level) count++;
    return count;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required';
    if (!formData.age || formData.age < 1 || formData.age > 120) errs.age = 'Valid age required';
    if (!formData.gender) errs.gender = 'Gender is required';
    if (!formData.disability) errs.disability = 'Please select Yes or No';
    if (!formData.state) errs.state = 'State is required';
    if (!formData.category) errs.category = 'Category is required';
    if (!formData.education_level) errs.education_level = 'Education level is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        gender: GENDER_TO_BACKEND[formData.gender] || formData.gender,
        age: parseInt(formData.age, 10),
        family_income: formData.family_income ? parseFloat(formData.family_income) : null,
      };
      // For frontend static demo: save to localStorage
      const profileKey = user ? `demoUserProfile_${user.id}` : 'demoUserProfile';
      localStorage.setItem(profileKey, JSON.stringify(payload));

      toast.success('Profile saved! Finding your eligible schemes...');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = completedSections();
  const isUpdate = formData.full_name && formData.state;

  if (initialLoading) {
    return (
      <main id="main-content" className="eligibility-page">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="eligibility-page">
      <div className="container">
        <div className="eligibility-header animate-fade-in">
          <h1 className="page-title">{isUpdate ? 'Update Your Profile' : 'Complete Your Profile'}</h1>
          <p className="eligibility-subtitle">
            Fill in your details to find government schemes you're eligible for
          </p>
        </div>

        <div className="eligibility-progress animate-fade-in">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(progress / 5) * 100}%` }} />
          </div>
          <span className="progress-label">{progress} of 5 sections completed</span>
        </div>

        <form onSubmit={handleSubmit} noValidate className="eligibility-form">
          <section className="form-section card-static animate-slide-up" aria-labelledby="section-personal">
            <div className="section-header">
              <div className="section-icon-wrapper">
                <FiUser size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 id="section-personal" className="section-title">Personal Information</h2>
                <p className="section-desc">Basic details about yourself</p>
              </div>
              {formData.full_name && formData.age && formData.gender && (
                <FiCheck className="section-check" size={20} aria-label="Section complete" />
              )}
            </div>
            <div className="section-fields">
              <div className="input-group">
                <label htmlFor="form-fullname">Full Name *</label>
                <input
                  id="form-fullname"
                  name="full_name"
                  type="text"
                  className={`input-field ${errors.full_name ? 'error' : ''}`}
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={!!errors.full_name}
                />
                {errors.full_name && <span className="input-error-text" role="alert">{errors.full_name}</span>}
              </div>
              <div className="fields-row">
                <div className="input-group">
                  <label htmlFor="form-age">Age *</label>
                  <input
                    id="form-age"
                    name="age"
                    type="number"
                    min="1"
                    max="120"
                    className={`input-field ${errors.age ? 'error' : ''}`}
                    placeholder="Age"
                    value={formData.age}
                    onChange={handleChange}
                    aria-required="true"
                    aria-invalid={!!errors.age}
                  />
                  {errors.age && <span className="input-error-text" role="alert">{errors.age}</span>}
                </div>
                <div className="input-group">
                  <label htmlFor="form-gender">Gender *</label>
                  <select
                    id="form-gender"
                    name="gender"
                    className={`select-field ${errors.gender ? 'error' : ''}`}
                    value={formData.gender}
                    onChange={handleChange}
                    aria-required="true"
                    aria-invalid={!!errors.gender}
                  >
                    <option value="">Select gender</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errors.gender && <span className="input-error-text" role="alert">{errors.gender}</span>}
                </div>
              </div>
            </div>
          </section>

          <section className="form-section card-static animate-slide-up stagger-1" aria-labelledby="section-disability">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-rose">
                <FiHeart size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 id="section-disability" className="section-title">Disability Details <span style={{ fontWeight: 400, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>(Optional)</span></h2>
                <p className="section-desc">Fill if applicable — leave blank if not</p>
              </div>
              {formData.disability && (
                <FiCheck className="section-check" size={20} aria-label="Section complete" />
              )}
            </div>
            <div className="section-fields">
              <div className="input-group">
                <label htmlFor="form-disability">Do you have any disability? *</label>
                <select
                  id="form-disability"
                  name="disability"
                  className={`select-field ${errors.disability ? 'error' : ''}`}
                  value={formData.disability}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={!!errors.disability}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
                {errors.disability && <span className="input-error-text" role="alert">{errors.disability}</span>}
              </div>
            </div>
          </section>

          <section className="form-section card-static animate-slide-up stagger-2" aria-labelledby="section-location">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-emerald">
                <FiMapPin size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 id="section-location" className="section-title">Location</h2>
                <p className="section-desc">Your state and district</p>
              </div>
              {formData.state && (
                <FiCheck className="section-check" size={20} aria-label="Section complete" />
              )}
            </div>
            <div className="section-fields fields-row">
              <div className="input-group">
                <label htmlFor="form-state">State / UT *</label>
                <select
                  id="form-state"
                  name="state"
                  className={`select-field ${errors.state ? 'error' : ''}`}
                  value={formData.state}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={!!errors.state}
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <span className="input-error-text" role="alert">{errors.state}</span>}
              </div>
              <div className="input-group">
                <label htmlFor="form-district">District</label>
                <input
                  id="form-district"
                  name="district"
                  type="text"
                  className="input-field"
                  placeholder="Enter your district"
                  value={formData.district}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <section className="form-section card-static animate-slide-up stagger-3" aria-labelledby="section-social">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-amber">
                <FiUser size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 id="section-social" className="section-title">Social & Economic</h2>
                <p className="section-desc">Category and income details</p>
              </div>
              {formData.category && (
                <FiCheck className="section-check" size={20} aria-label="Section complete" />
              )}
            </div>
            <div className="section-fields fields-row">
              <div className="input-group">
                <label htmlFor="form-category">Category *</label>
                <select
                  id="form-category"
                  name="category"
                  className={`select-field ${errors.category ? 'error' : ''}`}
                  value={formData.category}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={!!errors.category}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <span className="input-error-text" role="alert">{errors.category}</span>}
              </div>
              <div className="input-group">
                <label htmlFor="form-income">Annual Family Income (₹)</label>
                <input
                  id="form-income"
                  name="family_income"
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="e.g. 250000"
                  value={formData.family_income}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <section className="form-section card-static animate-slide-up stagger-4" aria-labelledby="section-education">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-blue">
                <FiBook size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 id="section-education" className="section-title">Education</h2>
                <p className="section-desc">Your education level and UDID</p>
              </div>
              {formData.education_level && (
                <FiCheck className="section-check" size={20} aria-label="Section complete" />
              )}
            </div>
            <div className="section-fields fields-row">
              <div className="input-group">
                <label htmlFor="form-education">Education Level *</label>
                <select
                  id="form-education"
                  name="education_level"
                  className={`select-field ${errors.education_level ? 'error' : ''}`}
                  value={formData.education_level}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={!!errors.education_level}
                  style={{ width: "45vw" }}
                >
                  <option value="">Select education level</option>
                  {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                {errors.education_level && <span className="input-error-text" role="alert">{errors.education_level}</span>}
              </div>
              {/* <div className="input-group">
                <label htmlFor="form-udid">UDID Number (Optional)</label>
                <input
                  id="form-udid"
                  name="udid_number"
                  type="text"
                  className="input-field"
                  placeholder="Enter UDID if available"
                  value={formData.udid_number}
                  onChange={handleChange}
                />
              </div> */}
            </div>
          </section>

          <div className="form-actions animate-slide-up stagger-5">
            <button
              type="submit"
              className="btn btn-primary btn-lg eligibility-submit"
              disabled={loading}
              id="eligibility-submit"
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  Saving profile...
                </>
              ) : (
                <>
                  Check Eligibility
                  <FiArrowRight size={18} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
