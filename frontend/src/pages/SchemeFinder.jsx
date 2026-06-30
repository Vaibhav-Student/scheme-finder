import { useState } from 'react';
import { toast } from 'react-toastify';
import { 
  FiUser, FiMapPin, FiHeart, FiBook, FiCheck, FiArrowRight, 
  FiShield, FiBriefcase, FiFileText, FiLayers 
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import SchemeCard from '../components/SchemeCard';
import './UserProfile.css';

const API_BASE = 'http://localhost:5000/api';

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
  'Student',
  'Farmer',
  'Salaried Employee',
  'Business Owner / Self-Employed',
  'Unemployed',
  'Retired / Pensioner',
  'Other'
];

const CROP_TYPES = ['Food Grains', 'Cash Crops', 'Horticulture', 'Other'];
const FARMER_CATEGORIES = ['Small / Marginal (less than 2 acres)', 'Semi-Medium / Medium (2-10 acres)', 'Large (more than 10 acres)'];
const SECTORS = ['Public / Government', 'Private Sector', 'NGO / Cooperative', 'Other'];
const BUSINESS_SECTORS = ['Retail / Wholesale', 'Manufacturing', 'Services', 'Agriculture Allied', 'Other'];
const UNEMPLOYED_DURATIONS = ['Less than 6 months', '6-12 months', 'More than 1 year'];

const CERTIFICATE_OPTIONS = [
  'Income Certificate', 
  'Caste Certificate', 
  'Disability Certificate', 
  'Domicile Certificate', 
  'Aadhaar Card', 
  'Bank Passbook'
];

const INTEREST_OPTIONS = [
  'Agriculture', 
  'Education', 
  'Healthcare', 
  'Housing', 
  'Pension', 
  'Financial Assistance', 
  'Skill Development', 
  'Other'
];

const INITIAL_FORM_STATE = {
  full_name: '',
  dob: '',
  age: '',
  gender: '',
  marital_status: '',
  num_children: '0',
  state: '',
  district: '',
  area_type: '',
  housing_status: '',
  has_disability: false,
  disability_type: '',
  category: '',
  is_minority: 'No',
  family_income: '',
  education_level: '',
  
  // Conditional Profile Fields
  primary_role: '',
  
  // Student nested fields
  student_school_name: '',
  student_course_name: '',
  student_is_hosteller: 'No',

  // Farmer nested fields
  farmer_land_size: '',
  farmer_crop_type: '',
  farmer_category: '',

  // Salaried nested fields
  employee_sector: '',
  employee_org_name: '',
  employee_monthly_salary: '',

  // Business Owner nested fields
  business_sector: '',
  business_turnover: '',
  business_is_gst_registered: 'No',

  // Unemployed nested fields
  unemployed_duration: '',
  unemployed_registered_exchange: 'No',

  // Retired nested fields
  retired_is_pensioner: 'No',
  retired_pension_amount: '',

  is_ex_serviceman: 'No',
  is_senior_citizen: 'No',
  has_aadhaar: 'Yes',
  has_bank_account: 'Yes',
  certificates: [],
  scheme_interest: [],
  udid_number: '',
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
        const updatedList = checked
          ? [...list, value]
          : list.filter((item) => item !== value);
        return { ...prev, [name]: updatedList };
      });
      return;
    }

    if (name === 'dob') {
      const birthDate = new Date(value);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }

      setFormData((prev) => ({
        ...prev,
        dob: value,
        age: calculatedAge >= 0 ? calculatedAge.toString() : '',
        is_senior_citizen: calculatedAge >= 60 ? 'Yes' : 'No'
      }));
      if (errors.age) setErrors((prev) => ({ ...prev, age: '' }));
      if (errors.dob) setErrors((prev) => ({ ...prev, dob: '' }));
      return;
    }

    setFormData((prev) => {
      const nextState = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'age') {
        const numAge = parseInt(value, 10);
        nextState.is_senior_citizen = numAge >= 60 ? 'Yes' : 'No';
      }

      if (name === 'has_disability' && !checked) {
        nextState.disability_type = '';
        nextState.udid_number = '';
      }

      return nextState;
    });

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
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
    
    // Category Sub-form Validation
    if (!formData.primary_role) {
      errs.primary_role = 'Primary activity is required';
    } else {
      if (formData.primary_role === 'Farmer') {
        if (!formData.farmer_land_size) errs.farmer_land_size = 'Land size is required';
      } else if (formData.primary_role === 'Salaried Employee') {
        if (!formData.employee_org_name.trim()) errs.employee_org_name = 'Organization name is required';
      } else if (formData.primary_role === 'Business Owner / Self-Employed') {
        if (!formData.business_turnover) errs.business_turnover = 'Annual turnover is required';
      }
    }

    if (formData.has_disability && !formData.disability_type) errs.disability_type = 'Select disability type';
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
          dob: formData.dob,
          marital_status: formData.marital_status,
          num_children: parseInt(formData.num_children, 10) || 0,
          area_type: formData.area_type,
          housing_status: formData.housing_status,
          is_minority: formData.is_minority,
          has_aadhaar: formData.has_aadhaar,
          has_bank_account: formData.has_bank_account,
          certificates: formData.certificates,
          scheme_interest: formData.scheme_interest,
          
          // Role matching specific fields
          primary_role: formData.primary_role,
          is_student: formData.primary_role === 'Student' ? 'Yes' : 'No',
          is_farmer: formData.primary_role === 'Farmer' ? 'Yes' : 'No',
          is_business_owner: formData.primary_role === 'Business Owner / Self-Employed' ? 'Yes' : 'No',
          is_ex_serviceman: formData.is_ex_serviceman,
          is_senior_citizen: formData.is_senior_citizen,

          // Nested Student fields
          student_school_name: formData.student_school_name,
          student_course_name: formData.student_course_name,
          student_is_hosteller: formData.student_is_hosteller,

          // Nested Farmer fields
          farmer_land_size: formData.farmer_land_size,
          farmer_crop_type: formData.farmer_crop_type,
          farmer_category: formData.farmer_category,

          // Nested Employee fields
          employee_sector: formData.employee_sector,
          employee_org_name: formData.employee_org_name,
          employee_monthly_salary: formData.employee_monthly_salary,

          // Nested Business fields
          business_sector: formData.business_sector,
          business_turnover: formData.business_turnover,
          business_is_gst_registered: formData.business_is_gst_registered,

          // Nested Unemployed fields
          unemployed_duration: formData.unemployed_duration,
          unemployed_registered_exchange: formData.unemployed_registered_exchange,

          // Nested Retired fields
          retired_is_pensioner: formData.retired_is_pensioner,
          retired_pension_amount: formData.retired_pension_amount
        }
      };

      if (user?.username) {
        await fetch(`${API_BASE}/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.error('Failed to save profile:', err));
      }

      const matchRes = await fetch(`${API_BASE}/schemes/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!matchRes.ok) throw new Error('Failed to find schemes');

      const matchedSchemes = await matchRes.json();
      setResults(matchedSchemes);
      setFormData(INITIAL_FORM_STATE);
      setErrors({});
      
      toast.success(`Found ${matchedSchemes.length} matching schemes!`);
      
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      console.error('Scheme finder error:', err);
      toast.error('Failed to find schemes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = completedSections();

  return (
    <main id="main-content" className="eligibility-page">
      <div className="container">
        <div className="eligibility-header animate-fade-in">
          <h1 className="page-title">Find Schemes Instantly</h1>
          <p className="eligibility-subtitle">
            Enter details below to instantly check eligibility against active government schemes. Form clears after submission so you can check again!
          </p>
        </div>

        <div className="eligibility-progress animate-fade-in">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(progress / 7) * 100}%` }} />
          </div>
          <span className="progress-label">{progress} of 7 sections completed</span>
        </div>

        <form onSubmit={handleSubmit} noValidate className="eligibility-form">
          {/* SECTION 1: PERSONAL INFO */}
          <section className="form-section card-static animate-slide-up">
            <div className="section-header">
              <div className="section-icon-wrapper"><FiUser size={20} /></div>
              <div>
                <h2 className="section-title">Personal Information</h2>
                <p className="section-desc">Basic details about the applicant</p>
              </div>
              {formData.full_name && formData.dob && formData.age && formData.gender && <FiCheck className="section-check" size={20} />}
            </div>
            <div className="section-fields">
              <div className="input-group">
                <label>Full Name *</label>
                <input name="full_name" type="text" className={`input-field ${errors.full_name ? 'error' : ''}`} placeholder="Applicant name" value={formData.full_name} onChange={handleChange} />
                {errors.full_name && <span className="input-error-text">{errors.full_name}</span>}
              </div>
              <div className="fields-row">
                <div className="input-group">
                  <label>Date of Birth *</label>
                  <input name="dob" type="date" className={`input-field ${errors.dob ? 'error' : ''}`} value={formData.dob} onChange={handleChange} />
                  {errors.dob && <span className="input-error-text">{errors.dob}</span>}
                </div>
                <div className="input-group">
                  <label>Age (Auto-calculated) *</label>
                  <input name="age" type="number" min="1" max="120" readOnly className={`input-field ${errors.age ? 'error' : ''}`} placeholder="Age" value={formData.age} onChange={handleChange} style={{ background: 'var(--bg-primary)', cursor: 'not-allowed' }} />
                  {errors.age && <span className="input-error-text">{errors.age}</span>}
                </div>
              </div>
              <div className="fields-row">
                <div className="input-group">
                  <label>Gender *</label>
                  <select name="gender" className={`select-field ${errors.gender ? 'error' : ''}`} value={formData.gender} onChange={handleChange}>
                    <option value="">Select gender</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errors.gender && <span className="input-error-text">{errors.gender}</span>}
                </div>
                <div className="input-group">
                  <label>Marital Status</label>
                  <select name="marital_status" className="select-field" value={formData.marital_status} onChange={handleChange}>
                    <option value="">Select marital status</option>
                    {MARITAL_STATUSES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="fields-row">
                <div className="input-group">
                  <label>Number of Children</label>
                  <input name="num_children" type="number" min="0" max="20" className="input-field" placeholder="0" value={formData.num_children} onChange={handleChange} />
                </div>
                <div className="input-group" style={{ display: 'none' }}></div>
              </div>
            </div>
          </section>

          {/* SECTION 2: LOCATION & AREA */}
          <section className="form-section card-static animate-slide-up stagger-1">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-emerald"><FiMapPin size={20} /></div>
              <div>
                <h2 className="section-title">Location & Infrastructure</h2>
                <p className="section-desc">State, district, and residential region details</p>
              </div>
              {formData.state && formData.district && formData.area_type && <FiCheck className="section-check" size={20} />}
            </div>
            <div className="section-fields">
              <div className="fields-row">
                <div className="input-group">
                  <label>State / UT *</label>
                  <select name="state" className={`select-field ${errors.state ? 'error' : ''}`} value={formData.state} onChange={handleChange}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <span className="input-error-text">{errors.state}</span>}
                </div>
                <div className="input-group">
                  <label>District / City *</label>
                  <input name="district" type="text" className={`input-field ${errors.district ? 'error' : ''}`} placeholder="e.g. Mumbai" value={formData.district} onChange={handleChange} />
                  {errors.district && <span className="input-error-text">{errors.district}</span>}
                </div>
              </div>
              <div className="fields-row">
                <div className="input-group">
                  <label>Rural / Urban Residence *</label>
                  <select name="area_type" className={`select-field ${errors.area_type ? 'error' : ''}`} value={formData.area_type} onChange={handleChange}>
                    <option value="">Select area type</option>
                    {AREA_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {errors.area_type && <span className="input-error-text">{errors.area_type}</span>}
                </div>
                <div className="input-group">
                  <label>Housing Status</label>
                  <select name="housing_status" className="select-field" value={formData.housing_status} onChange={handleChange}>
                    <option value="">Select housing status</option>
                    {HOUSING_STATUSES.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: DISABILITY DETAILS */}
          <section className="form-section card-static animate-slide-up stagger-2">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-rose"><FiHeart size={20} /></div>
              <div>
                <h2 className="section-title">Disability & Health Status</h2>
                <p className="section-desc">Helps find disability-specific schemes and health aids</p>
              </div>
              <FiCheck className="section-check" size={20} />
            </div>
            <div className="section-fields">
              <div className="input-group">
                <label className="disability-toggle-label">
                  <input type="checkbox" name="has_disability" checked={formData.has_disability} onChange={handleChange} style={{ width: 18, height: 18, accentColor: 'var(--color-primary-raw)' }} />
                  <span style={{ marginLeft: 8 }}>Applicant has a disability (PwD)</span>
                </label>
              </div>
              {formData.has_disability && (
                <div className="fields-row">
                  <div className="input-group">
                    <label>Disability Type *</label>
                    <select name="disability_type" className={`select-field ${errors.disability_type ? 'error' : ''}`} value={formData.disability_type} onChange={handleChange}>
                      <option value="">Select type</option>
                      {DISABILITY_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {errors.disability_type && <span className="input-error-text">{errors.disability_type}</span>}
                  </div>
                  <div className="input-group">
                    <label>UDID / Disability Card Number</label>
                    <input name="udid_number" type="text" className="input-field" placeholder="e.g. MH26102..." value={formData.udid_number} onChange={handleChange} />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 4: SOCIO-ECONOMIC DETAILS */}
          <section className="form-section card-static animate-slide-up stagger-3">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-amber"><FiShield size={20} /></div>
              <div>
                <h2 className="section-title">Socio-Economic & Caste</h2>
                <p className="section-desc">Category, minority, and financial background</p>
              </div>
              {formData.category && <FiCheck className="section-check" size={20} />}
            </div>
            <div className="section-fields">
              <div className="fields-row">
                <div className="input-group">
                  <label>Caste Category *</label>
                  <select name="category" className={`select-field ${errors.category ? 'error' : ''}`} value={formData.category} onChange={handleChange}>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <span className="input-error-text">{errors.category}</span>}
                </div>
                <div className="input-group">
                  <label>Belongs to Minority Community?</label>
                  <select name="is_minority" className="select-field" value={formData.is_minority} onChange={handleChange}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
              <div className="fields-row">
                <div className="input-group">
                  <label>Annual Family Income (₹)</label>
                  <input name="family_income" type="number" min="0" className="input-field" placeholder="e.g. 250000" value={formData.family_income} onChange={handleChange} />
                </div>
                <div className="input-group" style={{ display: 'none' }}></div>
              </div>
            </div>
          </section>

          {/* SECTION 5: PROFESSIONAL PROFILE & ROLE */}
          <section className="form-section card-static animate-slide-up stagger-4">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-blue"><FiBriefcase size={20} /></div>
              <div>
                <h2 className="section-title">Professional Profile & Role</h2>
                <p className="section-desc">Select your education and primary role to view role-specific details</p>
              </div>
              {formData.education_level && formData.primary_role && <FiCheck className="section-check" size={20} />}
            </div>
            <div className="section-fields">
              <div className="fields-row">
                <div className="input-group">
                  <label>Highest Education Level</label>
                  <select name="education_level" className="select-field" value={formData.education_level} onChange={handleChange}>
                    <option value="">Select education level</option>
                    {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Primary Activity / Role *</label>
                  <select name="primary_role" className={`select-field ${errors.primary_role ? 'error' : ''}`} value={formData.primary_role} onChange={handleChange}>
                    <option value="">Select primary role</option>
                    {PRIMARY_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {errors.primary_role && <span className="input-error-text">{errors.primary_role}</span>}
                </div>
              </div>

              {/* CONDITIONAL SUB-FORMS */}

              {/* STUDENT SUB-FORM */}
              {formData.primary_role === 'Student' && (
                <div className="conditional-fields-container animate-fade-in" style={{ marginTop: '1.5rem', borderLeft: '3px solid var(--color-primary-raw)', paddingLeft: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1.5rem', color: 'var(--color-primary-raw)', fontSize: '0.95rem', fontWeight: 600 }}>Student Profile Details</h4>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>School / College Name</label>
                      <input name="student_school_name" type="text" className="input-field" placeholder="e.g. Pune University" value={formData.student_school_name} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>Current Course / Class</label>
                      <input name="student_course_name" type="text" className="input-field" placeholder="e.g. B.Sc Computer Science" value={formData.student_course_name} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>Hosteller Status</label>
                      <select name="student_is_hosteller" className="select-field" value={formData.student_is_hosteller} onChange={handleChange}>
                        <option value="No">Day Scholar (No)</option>
                        <option value="Yes">Hosteller (Yes)</option>
                      </select>
                    </div>
                    <div className="input-group" style={{ display: 'none' }}></div>
                  </div>
                </div>
              )}

              {/* FARMER SUB-FORM */}
              {formData.primary_role === 'Farmer' && (
                <div className="conditional-fields-container animate-fade-in" style={{ marginTop: '1.5rem', borderLeft: '3px solid var(--color-success-raw)', paddingLeft: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1.5rem', color: 'var(--color-success-raw)', fontSize: '0.95rem', fontWeight: 600 }}>Farmer Profile Details</h4>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>Land Holding Size (Acres) *</label>
                      <input name="farmer_land_size" type="number" min="0" step="0.1" className={`input-field ${errors.farmer_land_size ? 'error' : ''}`} placeholder="e.g. 2.5" value={formData.farmer_land_size} onChange={handleChange} />
                      {errors.farmer_land_size && <span className="input-error-text">{errors.farmer_land_size}</span>}
                    </div>
                    <div className="input-group">
                      <label>Primary Crop Type</label>
                      <select name="farmer_crop_type" className="select-field" value={formData.farmer_crop_type} onChange={handleChange}>
                        <option value="">Select crop type</option>
                        {CROP_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>Farmer Category</label>
                      <select name="farmer_category" className="select-field" value={formData.farmer_category} onChange={handleChange}>
                        <option value="">Select category</option>
                        {FARMER_CATEGORIES.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="input-group" style={{ display: 'none' }}></div>
                  </div>
                </div>
              )}

              {/* SALARIED EMPLOYEE SUB-FORM */}
              {formData.primary_role === 'Salaried Employee' && (
                <div className="conditional-fields-container animate-fade-in" style={{ marginTop: '1.5rem', borderLeft: '3px solid var(--color-primary-raw)', paddingLeft: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1.5rem', color: 'var(--color-primary-raw)', fontSize: '0.95rem', fontWeight: 600 }}>Employee Profile Details</h4>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>Employer / Sector</label>
                      <select name="employee_sector" className="select-field" value={formData.employee_sector} onChange={handleChange}>
                        <option value="">Select sector</option>
                        {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Organization Name *</label>
                      <input name="employee_org_name" type="text" className={`input-field ${errors.employee_org_name ? 'error' : ''}`} placeholder="e.g. TCS / Ministry of Finance" value={formData.employee_org_name} onChange={handleChange} />
                      {errors.employee_org_name && <span className="input-error-text">{errors.employee_org_name}</span>}
                    </div>
                  </div>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>Monthly Salary (₹)</label>
                      <input name="employee_monthly_salary" type="number" min="0" className="input-field" placeholder="e.g. 25000" value={formData.employee_monthly_salary} onChange={handleChange} />
                    </div>
                    <div className="input-group" style={{ display: 'none' }}></div>
                  </div>
                </div>
              )}

              {/* BUSINESS OWNER SUB-FORM */}
              {formData.primary_role === 'Business Owner / Self-Employed' && (
                <div className="conditional-fields-container animate-fade-in" style={{ marginTop: '1.5rem', borderLeft: '3px solid var(--color-accent-raw)', paddingLeft: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1.5rem', color: 'var(--color-accent-raw)', fontSize: '0.95rem', fontWeight: 600 }}>Business Profile Details</h4>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>Business Sector</label>
                      <select name="business_sector" className="select-field" value={formData.business_sector} onChange={handleChange}>
                        <option value="">Select sector</option>
                        {BUSINESS_SECTORS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Annual Turnover (₹) *</label>
                      <input name="business_turnover" type="number" min="0" className={`input-field ${errors.business_turnover ? 'error' : ''}`} placeholder="e.g. 1500000" value={formData.business_turnover} onChange={handleChange} />
                      {errors.business_turnover && <span className="input-error-text">{errors.business_turnover}</span>}
                    </div>
                  </div>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>GST Registered?</label>
                      <select name="business_is_gst_registered" className="select-field" value={formData.business_is_gst_registered} onChange={handleChange}>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div className="input-group" style={{ display: 'none' }}></div>
                  </div>
                </div>
              )}

              {/* UNEMPLOYED SUB-FORM */}
              {formData.primary_role === 'Unemployed' && (
                <div className="conditional-fields-container animate-fade-in" style={{ marginTop: '1.5rem', borderLeft: '3px solid var(--color-warning)', paddingLeft: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1.5rem', color: 'var(--color-warning)', fontSize: '0.95rem', fontWeight: 600 }}>Unemployment Details</h4>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>Duration of Unemployment</label>
                      <select name="unemployed_duration" className="select-field" value={formData.unemployed_duration} onChange={handleChange}>
                        <option value="">Select duration</option>
                        {UNEMPLOYED_DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Registered with Employment Exchange?</label>
                      <select name="unemployed_registered_exchange" className="select-field" value={formData.unemployed_registered_exchange} onChange={handleChange}>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* RETIRED SUB-FORM */}
              {formData.primary_role === 'Retired / Pensioner' && (
                <div className="conditional-fields-container animate-fade-in" style={{ marginTop: '1.5rem', borderLeft: '3px solid var(--text-muted)', paddingLeft: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>Retired Profile Details</h4>
                  <div className="fields-row">
                    <div className="input-group">
                      <label>Gets Monthly Pension?</label>
                      <select name="retired_is_pensioner" className="select-field" value={formData.retired_is_pensioner} onChange={handleChange}>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    {formData.retired_is_pensioner === 'Yes' && (
                      <div className="input-group">
                        <label>Monthly Pension Amount (₹)</label>
                        <input name="retired_pension_amount" type="number" min="0" className="input-field" placeholder="e.g. 8000" value={formData.retired_pension_amount} onChange={handleChange} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 6: DOCUMENTATION & FINANCE */}
          <section className="form-section card-static animate-slide-up stagger-5">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-blue"><FiFileText size={20} /></div>
              <div>
                <h2 className="section-title">Documentation & Finance</h2>
                <p className="section-desc">Verify available ID documents and certificates</p>
              </div>
              <FiCheck className="section-check" size={20} />
            </div>
            <div className="section-fields">
              <div className="fields-row">
                <div className="input-group">
                  <label>Has Aadhaar Card?</label>
                  <select name="has_aadhaar" className="select-field" value={formData.has_aadhaar} onChange={handleChange}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Has Active Bank Account?</label>
                  <select name="has_bank_account" className="select-field" value={formData.has_bank_account} onChange={handleChange}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              <div className="input-group mt-4">
                <label style={{ marginBottom: '0.75rem' }}>Select Available Certificates</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {CERTIFICATE_OPTIONS.map((c) => (
                    <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input type="checkbox" name="certificates" value={c} checked={formData.certificates?.includes(c)} onChange={handleChange} style={{ width: 16, height: 16, accentColor: 'var(--color-primary-raw)' }} />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 7: INTERESTS & PREFERENCES */}
          <section className="form-section card-static animate-slide-up stagger-6">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-rose"><FiLayers size={20} /></div>
              <div>
                <h2 className="section-title">Scheme Category Interests</h2>
                <p className="section-desc">Select sectors/categories you are interested in *</p>
              </div>
              {formData.scheme_interest.length > 0 && <FiCheck className="section-check" size={20} />}
            </div>
            <div className="section-fields">
              <div className="input-group">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {INTEREST_OPTIONS.map((i) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input type="checkbox" name="scheme_interest" value={i} checked={formData.scheme_interest?.includes(i)} onChange={handleChange} style={{ width: 16, height: 16, accentColor: 'var(--color-primary-raw)' }} />
                      <span>{i}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="form-actions animate-slide-up stagger-7">
            <button type="submit" className="btn btn-primary btn-lg eligibility-submit" disabled={loading}>
              {loading ? (
                <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Searching...</>
              ) : (
                <><FiArrowRight size={18} /> Find Schemes Instantly</>
              )}
            </button>
          </div>
        </form>

        {/* RESULTS SECTION */}
        {results && (
          <div id="results-section" style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-light)' }}>
            <h2 className="page-title" style={{ marginBottom: '1.5rem', fontSize: '1.8rem' }}>
              Found {results.length} Eligible Scheme{results.length !== 1 ? 's' : ''}
            </h2>
            {results.length === 0 ? (
              <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No active schemes match these details.</p>
              </div>
            ) : (
              <div className="schemes-grid grid grid-2">
                {results.map((scheme, index) => (
                  <div key={scheme.id} className={`stagger-${(index % 6) + 1} animate-slide-up`} style={{ animationFillMode: 'both' }}>
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
