import { useState } from 'react';
import { toast } from 'react-toastify';
import { 
  FiUser, FiMapPin, FiHeart, FiBook, FiCheck, FiArrowRight, 
  FiShield, FiBriefcase, FiFileText, FiLayers, FiZap
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import SchemeCard from '../components/SchemeCard';
import CustomSelect from '../components/CustomSelect';
import CustomDatePicker from '../components/CustomDatePicker';
import './UserProfile.css';

const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

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
  'Pre-Primary', 'Primary', 'Secondary', 'Higher Secondary', 'Graduate', 'Post-Graduate', 'None'
];

const CATEGORIES = ['General', 'SC', 'ST', 'OBC'];
const GENDERS = ['Male', 'Female', 'Other'];
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'];
const AREA_TYPES = ['Rural', 'Urban'];
const HOUSING_STATUSES = ['Owns House', 'Rented', 'Homeless'];

const PRIMARY_ROLES = [
  { label: 'Student',                        emoji: '🎓' },
  { label: 'Farmer',                         emoji: '🌾' },
  { label: 'Salaried Employee',              emoji: '💼' },
  { label: 'Business Owner / Self-Employed', emoji: '🏪' },
  { label: 'Unemployed',                     emoji: '🔍' },
  { label: 'Retired / Pensioner',            emoji: '🧓' },
  { label: 'Other',                          emoji: '👤' },
];

const CROP_TYPES = ['Food Grains', 'Cash Crops', 'Horticulture', 'Other'];
const FARMER_CATEGORIES = ['Small / Marginal (less than 2 acres)', 'Semi-Medium / Medium (2-10 acres)', 'Large (more than 10 acres)'];
const SECTORS = ['Public / Government', 'Private Sector', 'NGO / Cooperative', 'Other'];
const BUSINESS_SECTORS = ['Retail / Wholesale', 'Manufacturing', 'Services', 'Agriculture Allied', 'Other'];
const UNEMPLOYED_DURATIONS = ['Less than 6 months', '6-12 months', 'More than 1 year'];

const INITIAL_FORM_STATE = {
  full_name: '', dob: '', age: '', gender: '', marital_status: '',
  num_children: '0', state: '', district: '', area_type: '',
  housing_status: '', has_disability: false, disability_type: '',
  category: '', is_minority: 'No', family_income: '', education_level: '',
  primary_role: '',
  student_school_name: '', student_course_name: '', student_is_hosteller: 'No',
  farmer_land_size: '', farmer_crop_type: '', farmer_category: '',
  employee_sector: '', employee_org_name: '', employee_monthly_salary: '',
  business_sector: '', business_turnover: '', business_is_gst_registered: 'No',
  unemployed_duration: '', unemployed_registered_exchange: 'No',
  retired_is_pensioner: 'No', retired_pension_amount: '',
  is_ex_serviceman: 'No', is_senior_citizen: 'No',
  has_aadhaar: 'Yes', has_bank_account: 'Yes',
  certificates: [], scheme_interest: [], udid_number: '',
};

export default function SchemeFinder() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [results, setResults] = useState(null);

  const completedSections = () => {
    let count = 0;
    if (formData.full_name && formData.dob && formData.age && formData.gender) count++;
    if (formData.state && formData.district && formData.area_type) count++;
    if (formData.has_disability !== undefined) count++;
    if (formData.category) count++;
    if (formData.primary_role) count++;
    if (formData.has_aadhaar && formData.has_bank_account) count++;
    if (formData.scheme_interest.length > 0) count++;
    return count;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'certificates' || name === 'scheme_interest') {
      setFormData((prev) => {
        const list = prev[name] || [];
        return { ...prev, [name]: checked ? [...list, value] : list.filter((i) => i !== value) };
      });
      return;
    }
    if (name === 'dob') {
      const birthDate = new Date(value);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) calculatedAge--;
      setFormData((prev) => ({
        ...prev, dob: value,
        age: calculatedAge >= 0 ? calculatedAge.toString() : '',
        is_senior_citizen: calculatedAge >= 60 ? 'Yes' : 'No',
      }));
      if (errors.age) setErrors((p) => ({ ...p, age: '' }));
      if (errors.dob) setErrors((p) => ({ ...p, dob: '' }));
      return;
    }
    setFormData((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'age') next.is_senior_citizen = parseInt(value, 10) >= 60 ? 'Yes' : 'No';
      if (name === 'has_disability' && !checked) { next.disability_type = ''; next.udid_number = ''; }
      return next;
    });
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleRoleSelect = (label) => {
    setFormData((prev) => ({ ...prev, primary_role: label }));
    if (errors.primary_role) setErrors((p) => ({ ...p, primary_role: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required';
    if (!formData.dob) errs.dob = 'Date of birth is required';
    if (!formData.age || formData.age < 1 || formData.age > 120) errs.age = 'Valid age required';
    if (!formData.gender) errs.gender = 'Gender is required';
    if (!formData.state) errs.state = 'State is required';
    if (!formData.district.trim()) errs.district = 'District/City is required';
    if (!formData.area_type) errs.area_type = 'Rural/Urban area is required';
    if (!formData.category) errs.category = 'Category is required';
    if (!formData.primary_role) {
      errs.primary_role = 'Primary activity is required';
    } else {
      if (formData.primary_role === 'Farmer' && !formData.farmer_land_size) errs.farmer_land_size = 'Land size is required';
      if (formData.primary_role === 'Salaried Employee' && !formData.employee_org_name.trim()) errs.employee_org_name = 'Organization name is required';
      if (formData.primary_role === 'Business Owner / Self-Employed' && !formData.business_turnover) errs.business_turnover = 'Annual turnover is required';
    }
    if (formData.has_disability && !formData.disability_type) errs.disability_type = 'Select disability type';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fill all required fields.'); return; }
    setLoading(true);
    setResults(null);
    try {
      const payload = {
        username: user?.username,
        full_name: formData.full_name,
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        has_disability: formData.has_disability,
        disability_type: formData.disability_type || null,
        disability_percentage: 0,
        state: formData.state,
        district: formData.district,
        category: formData.category,
        family_income: formData.family_income ? parseFloat(formData.family_income) : null,
        education_level: formData.education_level,
        udid_number: formData.udid_number || null,
        extra_fields: {
          dob: formData.dob, marital_status: formData.marital_status,
          num_children: parseInt(formData.num_children, 10) || 0,
          area_type: formData.area_type, housing_status: formData.housing_status,
          is_minority: formData.is_minority, has_aadhaar: formData.has_aadhaar,
          has_bank_account: formData.has_bank_account, certificates: formData.certificates,
          scheme_interest: formData.scheme_interest, primary_role: formData.primary_role,
          is_student: formData.primary_role === 'Student' ? 'Yes' : 'No',
          is_farmer: formData.primary_role === 'Farmer' ? 'Yes' : 'No',
          is_business_owner: formData.primary_role === 'Business Owner / Self-Employed' ? 'Yes' : 'No',
          is_ex_serviceman: formData.is_ex_serviceman, is_senior_citizen: formData.is_senior_citizen,
          student_school_name: formData.student_school_name, student_course_name: formData.student_course_name,
          student_is_hosteller: formData.student_is_hosteller, farmer_land_size: formData.farmer_land_size,
          farmer_crop_type: formData.farmer_crop_type, farmer_category: formData.farmer_category,
          employee_sector: formData.employee_sector, employee_org_name: formData.employee_org_name,
          employee_monthly_salary: formData.employee_monthly_salary, business_sector: formData.business_sector,
          business_turnover: formData.business_turnover, business_is_gst_registered: formData.business_is_gst_registered,
          unemployed_duration: formData.unemployed_duration, unemployed_registered_exchange: formData.unemployed_registered_exchange,
          retired_is_pensioner: formData.retired_is_pensioner, retired_pension_amount: formData.retired_pension_amount,
        },
      };

      if (user?.username) {
        await fetch(`${API_BASE}/profile`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        }).catch((err) => console.error('Failed to save profile:', err));
      }

      const matchRes = await fetch(`${API_BASE}/schemes/match`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!matchRes.ok) throw new Error('Failed to find schemes');
      const matchedSchemes = await matchRes.json();
      setResults(matchedSchemes);
      setFormData(INITIAL_FORM_STATE);
      setErrors({});
      toast.success(`Found ${matchedSchemes.length} matching schemes!`);
      setTimeout(() => { document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    } catch (err) {
      console.error('Scheme finder error:', err);
      toast.error('Failed to find schemes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = completedSections();
  const progressPct = Math.round((progress / 7) * 100);

  /* ── Sub-form style helper ─────────────────────────────── */
  const subFormColors = {
    'Student':                        { accent: '#6366F1', bg: 'rgba(99,102,241,0.06)',  border: 'rgba(99,102,241,0.2)' },
    'Farmer':                         { accent: '#10B981', bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.2)' },
    'Salaried Employee':              { accent: '#0EA5E9', bg: 'rgba(14,165,233,0.06)',  border: 'rgba(14,165,233,0.2)' },
    'Business Owner / Self-Employed': { accent: '#8B5CF6', bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.2)' },
    'Unemployed':                     { accent: '#F59E0B', bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.2)' },
    'Retired / Pensioner':            { accent: '#94A3B8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.2)' },
  };
  const roleColor = subFormColors[formData.primary_role] || subFormColors['Student'];

  return (
    <main id="main-content" className="eligibility-page">
      <div className="container">

        {/* ── Hero Header ─────────────────────────────── */}
        <div className="eligibility-header animate-fade-in">
          <div className="eligibility-header-badge">
            <FiZap size={12} />
            Instant Eligibility Check
          </div>
          <h1 className="page-title">Find Schemes Instantly</h1>
          <p className="eligibility-subtitle">
            Fill in your details and instantly discover government schemes you qualify for. Takes under 2 minutes!
          </p>
        </div>

        {/* ── Progress Bar ─────────────────────────────── */}
        <div className="eligibility-progress animate-fade-in">
          <div className="progress-header">
            <span className="progress-label">{progress} of 7 sections completed</span>
            <span className="progress-pct">{progressPct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="eligibility-form">

          {/* ── SECTION 1: PERSONAL INFO ─────────────── */}
          <section className="form-section">
            <div className="section-header">
              <div className="section-icon-wrapper"><FiUser size={20} /></div>
              <div>
                <h2 className="section-title">Personal Information</h2>
                <p className="section-desc">Basic details about the applicant</p>
              </div>
              {formData.full_name && formData.dob && formData.age && formData.gender && (
                <FiCheck className="section-check" size={16} />
              )}
            </div>
            <div className="section-fields">
              <div className="input-group">
                <label>Full Name *</label>
                <input name="full_name" type="text" className={`input-field ${errors.full_name ? 'error' : ''}`}
                  placeholder="Applicant's full name" value={formData.full_name} onChange={handleChange} />
                {errors.full_name && <span className="input-error-text">{errors.full_name}</span>}
              </div>
              <div className="fields-row">
                <div className="input-group">
                  <label>Date of Birth *</label>
                  <CustomDatePicker
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    error={!!errors.dob}
                    placeholder="DD/MM/YYYY"
                  />
                  {errors.dob && <span className="input-error-text">{errors.dob}</span>}
                </div>
                <div className="input-group">
                  <label>Age (Auto-calculated)</label>
                  <input name="age" type="number" readOnly className={`input-field ${errors.age ? 'error' : ''}`}
                    placeholder="—" value={formData.age} onChange={handleChange} />
                  {errors.age && <span className="input-error-text">{errors.age}</span>}
                </div>
              </div>
              <div className="fields-row">
                <div className="input-group">
                  <label>Gender *</label>
                  <CustomSelect name="gender" value={formData.gender} onChange={handleChange}
                    options={GENDERS} placeholder="Select gender" error={!!errors.gender} />
                  {errors.gender && <span className="input-error-text">{errors.gender}</span>}
                </div>
                <div className="input-group">
                  <label>Marital Status</label>
                  <CustomSelect name="marital_status" value={formData.marital_status} onChange={handleChange}
                    options={MARITAL_STATUSES} placeholder="Select marital status" />
                </div>
              </div>
              <div className="fields-row">
                <div className="input-group">
                  <label>Number of Children</label>
                  <input name="num_children" type="number" min="0" max="20" className="input-field"
                    placeholder="0" value={formData.num_children} onChange={handleChange} />
                </div>
                <div className="input-group" style={{ visibility: 'hidden' }}></div>
              </div>
            </div>
          </section>

          {/* ── SECTION 2: LOCATION ──────────────────── */}
          <section className="form-section">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-emerald"><FiMapPin size={20} /></div>
              <div>
                <h2 className="section-title">Location & Infrastructure</h2>
                <p className="section-desc">State, district, and residential region details</p>
              </div>
              {formData.state && formData.district && formData.area_type && (
                <FiCheck className="section-check" size={16} />
              )}
            </div>
            <div className="section-fields">
              <div className="fields-row">
                <div className="input-group">
                  <label>State / UT *</label>
                  <CustomSelect name="state" value={formData.state} onChange={handleChange}
                    options={INDIAN_STATES} placeholder="Select state" error={!!errors.state} />
                  {errors.state && <span className="input-error-text">{errors.state}</span>}
                </div>
                <div className="input-group">
                  <label>District / City *</label>
                  <input name="district" type="text" className={`input-field ${errors.district ? 'error' : ''}`}
                    placeholder="e.g. Mumbai" value={formData.district} onChange={handleChange} />
                  {errors.district && <span className="input-error-text">{errors.district}</span>}
                </div>
              </div>
              <div className="fields-row">
                <div className="input-group">
                  <label>Rural / Urban Area *</label>
                  <CustomSelect name="area_type" value={formData.area_type} onChange={handleChange}
                    options={AREA_TYPES} placeholder="Select area type" error={!!errors.area_type} />
                  {errors.area_type && <span className="input-error-text">{errors.area_type}</span>}
                </div>
                <div className="input-group">
                  <label>Housing Status</label>
                  <CustomSelect name="housing_status" value={formData.housing_status} onChange={handleChange}
                    options={HOUSING_STATUSES} placeholder="Select housing status" />
                </div>
              </div>
            </div>
          </section>

          {/* ── SECTION 3: DISABILITY ────────────────── */}
          <section className="form-section">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-rose"><FiHeart size={20} /></div>
              <div>
                <h2 className="section-title">Disability & Health Status</h2>
                <p className="section-desc">Helps find disability-specific schemes and health aids</p>
              </div>
              <FiCheck className="section-check" size={16} />
            </div>
            <div className="section-fields">
              <div className="input-group">
                <label className="disability-toggle-label">
                  <input type="checkbox" name="has_disability" checked={formData.has_disability} onChange={handleChange} />
                  <span>Applicant has a disability (PwD)</span>
                </label>
              </div>
              {formData.has_disability && (
                <div className="fields-row animate-fade-in">
                  <div className="input-group">
                    <label>Disability Type *</label>
                    <CustomSelect name="disability_type" value={formData.disability_type} onChange={handleChange}
                      options={DISABILITY_TYPES} placeholder="Select type" error={!!errors.disability_type} />
                    {errors.disability_type && <span className="input-error-text">{errors.disability_type}</span>}
                  </div>
                  <div className="input-group">
                    <label>UDID / Disability Card Number</label>
                    <input name="udid_number" type="text" className="input-field"
                      placeholder="e.g. MH26102..." value={formData.udid_number} onChange={handleChange} />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── SECTION 4: SOCIO-ECONOMIC ────────────── */}
          <section className="form-section">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-amber"><FiShield size={20} /></div>
              <div>
                <h2 className="section-title">Socio-Economic & Caste</h2>
                <p className="section-desc">Category, minority, and financial background</p>
              </div>
              {formData.category && <FiCheck className="section-check" size={16} />}
            </div>
            <div className="section-fields">
              <div className="fields-row">
                <div className="input-group">
                  <label>Caste Category *</label>
                  <CustomSelect name="category" value={formData.category} onChange={handleChange}
                    options={CATEGORIES} placeholder="Select category" error={!!errors.category} />
                  {errors.category && <span className="input-error-text">{errors.category}</span>}
                </div>
                <div className="input-group">
                  <label>Belongs to Minority Community?</label>
                  <CustomSelect name="is_minority" value={formData.is_minority} onChange={handleChange}
                    options={['No', 'Yes']} placeholder="Select minority community community communitycommunity status" />
                </div>
              </div>
              <div className="fields-row">
                <div className="input-group">
                  <label>Annual Family Income (₹)</label>
                  <input name="family_income" type="number" min="0" className="input-field"
                    placeholder="e.g. 250000" value={formData.family_income} onChange={handleChange} />
                </div>
                <div className="input-group" style={{ visibility: 'hidden' }}></div>
              </div>
            </div>
          </section>

          {/* ── SECTION 5: PROFESSIONAL ROLE ─────────── */}
          <section className="form-section">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-blue"><FiBriefcase size={20} /></div>
              <div>
                <h2 className="section-title">Professional Profile & Role</h2>
                <p className="section-desc">Education and primary occupation</p>
              </div>
              {formData.education_level && formData.primary_role && <FiCheck className="section-check" size={16} />}
            </div>
            <div className="section-fields">
              <div className="input-group">
                <label>Highest Education Level</label>
                <CustomSelect name="education_level" value={formData.education_level} onChange={handleChange}
                  options={EDUCATION_LEVELS} placeholder="Select education level" />
              </div>

              {/* Role Selector Cards */}
              <div className="input-group">
                <label>Primary Activity / Role *</label>
                {errors.primary_role && <span className="input-error-text" style={{ marginBottom: '0.5rem' }}>{errors.primary_role}</span>}
                <div className="role-cards-grid">
                  {PRIMARY_ROLES.map(({ label, emoji }) => (
                    <button
                      key={label}
                      type="button"
                      className={`role-card ${formData.primary_role === label ? 'active' : ''}`}
                      onClick={() => handleRoleSelect(label)}
                    >
                      <span className="role-card-emoji">{emoji}</span>
                      <span className="role-card-label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── STUDENT SUB-FORM ─────────────────── */}
              {formData.primary_role === 'Student' && (
                <div className="conditional-fields-container animate-fade-in"
                  style={{ borderColor: roleColor.border, background: roleColor.bg }}>
                  <div className="sub-form-title" style={{ color: roleColor.accent }}>
                    🎓 Student Profile Details
                  </div>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>School / College Name</label>
                      <input name="student_school_name" type="text" className="input-field"
                        placeholder="e.g. Pune University" value={formData.student_school_name} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>Current Course / Class</label>
                      <input name="student_course_name" type="text" className="input-field"
                        placeholder="e.g. B.Sc Computer Science" value={formData.student_course_name} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="fields-row" style={{ marginTop: '1rem' }}>
                    <div className="input-group">
                      <label>Hosteller Status</label>
                      <CustomSelect name="student_is_hosteller" value={formData.student_is_hosteller} onChange={handleChange}
                        options={[{ value: 'No', label: 'Day Scholar (No)' }, { value: 'Yes', label: 'Hosteller (Yes)' }]} placeholder="Select hosteller status" />
                    </div>
                    <div className="input-group" style={{ visibility: 'hidden' }}></div>
                  </div>
                </div>
              )}

              {/* ── FARMER SUB-FORM ──────────────────── */}
              {formData.primary_role === 'Farmer' && (
                <div className="conditional-fields-container animate-fade-in"
                  style={{ borderColor: roleColor.border, background: roleColor.bg }}>
                  <div className="sub-form-title" style={{ color: roleColor.accent }}>
                    🌾 Farmer Profile Details
                  </div>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>Land Holding Size (Acres) *</label>
                      <input name="farmer_land_size" type="number" min="0" step="0.1"
                        className={`input-field ${errors.farmer_land_size ? 'error' : ''}`}
                        placeholder="e.g. 2.5" value={formData.farmer_land_size} onChange={handleChange} />
                      {errors.farmer_land_size && <span className="input-error-text">{errors.farmer_land_size}</span>}
                    </div>
                    <div className="input-group">
                      <label>Primary Crop Type</label>
                      <CustomSelect name="farmer_crop_type" value={formData.farmer_crop_type} onChange={handleChange}
                        options={CROP_TYPES} placeholder="Select crop type" />
                    </div>
                  </div>
                  <div className="fields-row" style={{ marginTop: '1rem' }}>
                    <div className="input-group">
                      <label>Farmer Category</label>
                      <CustomSelect name="farmer_category" value={formData.farmer_category} onChange={handleChange}
                        options={FARMER_CATEGORIES} placeholder="Select category" />
                    </div>
                    <div className="input-group" style={{ visibility: 'hidden' }}></div>
                  </div>
                </div>
              )}

              {/* ── SALARIED EMPLOYEE SUB-FORM ────────── */}
              {formData.primary_role === 'Salaried Employee' && (
                <div className="conditional-fields-container animate-fade-in"
                  style={{ borderColor: roleColor.border, background: roleColor.bg }}>
                  <div className="sub-form-title" style={{ color: roleColor.accent }}>
                    💼 Employee Profile Details
                  </div>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>Employer / Sector</label>
                      <CustomSelect name="employee_sector" value={formData.employee_sector} onChange={handleChange}
                        options={SECTORS} placeholder="Select sector" />
                    </div>
                    <div className="input-group">
                      <label>Organization Name *</label>
                      <input name="employee_org_name" type="text"
                        className={`input-field ${errors.employee_org_name ? 'error' : ''}`}
                        placeholder="e.g. TCS / Ministry of Finance" value={formData.employee_org_name} onChange={handleChange} />
                      {errors.employee_org_name && <span className="input-error-text">{errors.employee_org_name}</span>}
                    </div>
                  </div>
                  <div className="fields-row" style={{ marginTop: '1rem' }}>
                    <div className="input-group">
                      <label>Monthly Salary (₹)</label>
                      <input name="employee_monthly_salary" type="number" min="0" className="input-field"
                        placeholder="e.g. 25000" value={formData.employee_monthly_salary} onChange={handleChange} />
                    </div>
                    <div className="input-group" style={{ visibility: 'hidden' }}></div>
                  </div>
                </div>
              )}

              {/* ── BUSINESS OWNER SUB-FORM ───────────── */}
              {formData.primary_role === 'Business Owner / Self-Employed' && (
                <div className="conditional-fields-container animate-fade-in"
                  style={{ borderColor: roleColor.border, background: roleColor.bg }}>
                  <div className="sub-form-title" style={{ color: roleColor.accent }}>
                    🏪 Business Profile Details
                  </div>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>Business Sector</label>
                      <CustomSelect name="business_sector" value={formData.business_sector} onChange={handleChange}
                        options={BUSINESS_SECTORS} placeholder="Select sector" />
                    </div>
                    <div className="input-group">
                      <label>Annual Turnover (₹) *</label>
                      <input name="business_turnover" type="number" min="0"
                        className={`input-field ${errors.business_turnover ? 'error' : ''}`}
                        placeholder="e.g. 1500000" value={formData.business_turnover} onChange={handleChange} />
                      {errors.business_turnover && <span className="input-error-text">{errors.business_turnover}</span>}
                    </div>
                  </div>
                  <div className="fields-row" style={{ marginTop: '1rem' }}>
                    <div className="input-group">
                      <label>GST Registered?</label>
                      <CustomSelect name="business_is_gst_registered" value={formData.business_is_gst_registered} onChange={handleChange}
                        options={['No', 'Yes']} placeholder="Select GST status" />
                    </div>
                    <div className="input-group" style={{ visibility: 'hidden' }}></div>
                  </div>
                </div>
              )}

              {/* ── UNEMPLOYED SUB-FORM ───────────────── */}
              {formData.primary_role === 'Unemployed' && (
                <div className="conditional-fields-container animate-fade-in"
                  style={{ borderColor: roleColor.border, background: roleColor.bg }}>
                  <div className="sub-form-title" style={{ color: roleColor.accent }}>
                    🔍 Unemployment Details
                  </div>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>Duration of Unemployment</label>
                      <CustomSelect name="unemployed_duration" value={formData.unemployed_duration} onChange={handleChange}
                        options={UNEMPLOYED_DURATIONS} placeholder="Select duration" />
                    </div>
                    <div className="input-group">
                      <label>Registered with Employment Exchange?</label>
                      <CustomSelect name="unemployed_registered_exchange" value={formData.unemployed_registered_exchange} onChange={handleChange}
                        options={['No', 'Yes']} placeholder="Select exchange registration status" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── RETIRED SUB-FORM ──────────────────── */}
              {formData.primary_role === 'Retired / Pensioner' && (
                <div className="conditional-fields-container animate-fade-in"
                  style={{ borderColor: roleColor.border, background: roleColor.bg }}>
                  <div className="sub-form-title" style={{ color: roleColor.accent }}>
                    🧓 Retired Profile Details
                  </div>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>Gets Monthly Pension?</label>
                      <CustomSelect name="retired_is_pensioner" value={formData.retired_is_pensioner} onChange={handleChange}
                        options={['No', 'Yes']} placeholder="Select pension status" />
                    </div>
                    {formData.retired_is_pensioner === 'Yes' && (
                      <div className="input-group">
                        <label>Monthly Pension Amount (₹)</label>
                        <input name="retired_pension_amount" type="number" min="0" className="input-field"
                          placeholder="e.g. 8000" value={formData.retired_pension_amount} onChange={handleChange} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── SECTION 6: DOCUMENTATION ─────────────── */}
          <section className="form-section">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-blue"><FiFileText size={20} /></div>
              <div>
                <h2 className="section-title">Documentation & Finance</h2>
                <p className="section-desc">Verify available ID documents and certificates</p>
              </div>
              <FiCheck className="section-check" size={16} />
            </div>
            <div className="section-fields">
              <div className="fields-row">
                <div className="input-group">
                  <label>Has Aadhaar Card?</label>
                  <CustomSelect name="has_aadhaar" value={formData.has_aadhaar} onChange={handleChange}
                    options={['Yes', 'No']} placeholder="Select Aadhaar availability" />
                </div>
                <div className="input-group">
                  <label>Has Active Bank Account?</label>
                  <CustomSelect name="has_bank_account" value={formData.has_bank_account} onChange={handleChange}
                    options={['Yes', 'No']} placeholder="Select bank account status" />
                </div>
              </div>
            </div>
          </section>

          {/* ── SUBMIT ───────────────────────────────── */}
          <div className="form-actions animate-slide-up">
            <button type="submit" className="eligibility-submit" disabled={loading}>
              {loading ? (
                <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Searching…</>
              ) : (
                <><FiZap size={18} /> Find My Schemes</>
              )}
            </button>
          </div>
        </form>

        {/* ── RESULTS ──────────────────────────────── */}
        {results && (
          <div id="results-section" className="results-section animate-fade-in">
            <div className="results-header">
              <h2 className="results-title">
                Eligible Schemes
                <span className="results-count-badge">{results.length}</span>
              </h2>
            </div>
            {results.length === 0 ? (
              <div className="results-empty">
                <div className="results-empty-icon">🔍</div>
                <p>No active schemes match these details. Check back soon — new schemes are added regularly!</p>
              </div>
            ) : (
              <div className="schemes-grid grid grid-2">
                {results.map((scheme, index) => (
                  <div key={scheme.id} className={`stagger-${(index % 6) + 1} animate-slide-up`}
                    style={{ animationFillMode: 'both' }}>
                    <SchemeCard scheme={scheme} showMatchScore />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
