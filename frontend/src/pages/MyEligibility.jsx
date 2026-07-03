import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiFileText, FiMapPin, FiBriefcase, FiDollarSign, FiEdit2, 
  FiHeart, FiCheckCircle, FiLayers 
} from 'react-icons/fi';
import './MyEligibility.css';

const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

export default function MyEligibility() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.username) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/profile/${user.username}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <main id="main-content" className="eligibility-page">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      </main>
    );
  }

  if (!profile || !profile.age) {
    return (
      <main id="main-content" className="eligibility-page">
        <div className="container" style={{ maxWidth: '700px' }}>
          <div className="empty-state card">
            <div className="empty-state-icon">📋</div>
            <h2 className="empty-state-title">No Eligibility Data Found</h2>
            <p className="empty-state-text">You have not filled out the Scheme Finder form yet. Fill it out to discover matching schemes!</p>
            <button className="btn btn-primary mt-4" onClick={() => navigate('/finder')}>Go to Scheme Finder</button>
          </div>
        </div>
      </main>
    );
  }

  const extraFields = profile.extra_fields 
    ? (typeof profile.extra_fields === 'string' ? JSON.parse(profile.extra_fields) : profile.extra_fields)
    : {};

  const renderValue = (val) => {
    if (val === 'Yes' || val === true) {
      return <span className="status-badge status-yes">Yes</span>;
    }
    if (val === 'No' || val === false) {
      return <span className="status-badge status-no">No</span>;
    }
    return val || 'N/A';
  };

  return (
    <main id="main-content" className="eligibility-page">
      <div className="container" style={{ maxWidth: '1000px' }}>
        <header className="page-header animate-fade-in">
          <div className="eligibility-header-badge" style={{ marginBottom: '1rem' }}>
            <FiFileText size={12} /> Personal Scheme Data
          </div>
          <h1 className="page-title">My Eligibility Profile</h1>
          <p className="eligibility-subtitle">The data you submitted to find matching schemes.</p>
          <button className="btn btn-primary" onClick={() => navigate('/finder')} style={{ marginTop: '1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', border: 'none', color: '#fff', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)', padding: '0.6rem 1.8rem' }}>
            <FiEdit2 size={16} /> Update Profile Data
          </button>
        </header>

        <div className="grid grid-2 animate-slide-up">
          {/* Section 1: Personal Info */}
          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper section-icon-blue"><FiFileText size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Personal Info</h3>
              </div>
            </div>
            <div className="parameter-grid">
              <div className="parameter-block">
                <span className="parameter-label">Full Name</span>
                <span className="parameter-value">{profile.full_name}</span>
              </div>
              <div className="parameter-block">
                <span className="parameter-label">Date of Birth</span>
                <span className="parameter-value">{extraFields.dob || 'N/A'}</span>
              </div>
              <div className="parameter-block">
                <span className="parameter-label">Age</span>
                <span className="parameter-value">{profile.age}</span>
              </div>
              <div className="parameter-block">
                <span className="parameter-label">Gender</span>
                <span className="parameter-value">{profile.gender}</span>
              </div>
              <div className="parameter-block">
                <span className="parameter-label">Marital Status</span>
                <span className="parameter-value">{extraFields.marital_status || 'N/A'}</span>
              </div>
              <div className="parameter-block">
                <span className="parameter-label">Number of Children</span>
                <span className="parameter-value">{extraFields.num_children ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper section-icon-green"><FiMapPin size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Location & Residence</h3>
              </div>
            </div>
            <div className="parameter-grid">
              <div className="parameter-block">
                <span className="parameter-label">State</span>
                <span className="parameter-value">{profile.state}</span>
              </div>
              <div className="parameter-block">
                <span className="parameter-label">District</span>
                <span className="parameter-value">{profile.district}</span>
              </div>
              <div className="parameter-block">
                <span className="parameter-label">Area Type</span>
                <span className="parameter-value">{extraFields.area_type || 'N/A'}</span>
              </div>
              <div className="parameter-block">
                <span className="parameter-label">Housing Status</span>
                <span className="parameter-value">{extraFields.housing_status || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Socio-Economic */}
          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><FiDollarSign size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Socio-Economic & Caste</h3>
              </div>
            </div>
            <div className="parameter-grid">
              <div className="parameter-block">
                <span className="parameter-label">Caste Category</span>
                <span className="parameter-value">{profile.category}</span>
              </div>
              <div className="parameter-block">
                <span className="parameter-label">Minority Status</span>
                <span className="parameter-value">{renderValue(extraFields.is_minority)}</span>
              </div>
              <div className="parameter-block span-2">
                <span className="parameter-label">Annual Income</span>
                <span className="parameter-value" style={{ color: '#10B981', fontSize: '1.05rem', fontWeight: 700 }}>
                  ₹{profile.family_income?.toLocaleString() || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Disability */}
          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}><FiHeart size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Disability Status</h3>
              </div>
            </div>
            <div className="parameter-grid">
              <div className="parameter-block span-2">
                <span className="parameter-label">Has Disability</span>
                <span className="parameter-value">{renderValue(profile.has_disability)}</span>
              </div>
              {profile.has_disability ? (
                <>
                  <div className="parameter-block">
                    <span className="parameter-label">Type</span>
                    <span className="parameter-value">{profile.disability_type}</span>
                  </div>
                  {profile.udid_number && (
                    <div className="parameter-block">
                      <span className="parameter-label">UDID</span>
                      <span className="parameter-value">{profile.udid_number}</span>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* Section 5: Employment & Profile */}
          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper section-icon-blue"><FiBriefcase size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Professional Profile</h3>
              </div>
            </div>
            <div className="parameter-grid">
              <div className="parameter-block">
                <span className="parameter-label">Highest Education</span>
                <span className="parameter-value">{profile.education_level || 'N/A'}</span>
              </div>
              <div className="parameter-block">
                <span className="parameter-label">Primary Activity / Role</span>
                <span className="parameter-value" style={{ color: 'var(--color-primary-raw)', fontWeight: 700 }}>
                  {extraFields.primary_role || 'N/A'}
                </span>
              </div>
              
              {/* Conditional Nested details */}
              {extraFields.primary_role && extraFields.primary_role !== 'Other' && (
                <div className="parameter-block nested-section-header">
                  <span className="nested-title-text">{extraFields.primary_role} Details</span>
                </div>
              )}

              {extraFields.primary_role === 'Student' && (
                <>
                  <div className="parameter-block span-2">
                    <span className="parameter-label">School / College</span>
                    <span className="parameter-value">{extraFields.student_school_name || 'N/A'}</span>
                  </div>
                  <div className="parameter-block">
                    <span className="parameter-label">Course / Class</span>
                    <span className="parameter-value">{extraFields.student_course_name || 'N/A'}</span>
                  </div>
                  <div className="parameter-block">
                    <span className="parameter-label">Is Hosteller</span>
                    <span className="parameter-value">{renderValue(extraFields.student_is_hosteller)}</span>
                  </div>
                </>
              )}

              {extraFields.primary_role === 'Farmer' && (
                <>
                  <div className="parameter-block">
                    <span className="parameter-label">Land Size (Acres)</span>
                    <span className="parameter-value">{extraFields.farmer_land_size || 'N/A'}</span>
                  </div>
                  <div className="parameter-block">
                    <span className="parameter-label">Crop Type</span>
                    <span className="parameter-value">{extraFields.farmer_crop_type || 'N/A'}</span>
                  </div>
                  <div className="parameter-block span-2">
                    <span className="parameter-label">Farmer Category</span>
                    <span className="parameter-value">{extraFields.farmer_category || 'N/A'}</span>
                  </div>
                </>
              )}

              {extraFields.primary_role === 'Salaried Employee' && (
                <>
                  <div className="parameter-block">
                    <span className="parameter-label">Employer Sector</span>
                    <span className="parameter-value">{extraFields.employee_sector || 'N/A'}</span>
                  </div>
                  <div className="parameter-block">
                    <span className="parameter-label">Organization</span>
                    <span className="parameter-value">{extraFields.employee_org_name || 'N/A'}</span>
                  </div>
                  <div className="parameter-block span-2">
                    <span className="parameter-label">Monthly Salary</span>
                    <span className="parameter-value" style={{ color: '#10B981' }}>₹{extraFields.employee_monthly_salary || 'N/A'}</span>
                  </div>
                </>
              )}

              {extraFields.primary_role === 'Business Owner / Self-Employed' && (
                <>
                  <div className="parameter-block">
                    <span className="parameter-label">Business Sector</span>
                    <span className="parameter-value">{extraFields.business_sector || 'N/A'}</span>
                  </div>
                  <div className="parameter-block">
                    <span className="parameter-label">Annual Turnover</span>
                    <span className="parameter-value">₹{extraFields.business_turnover || 'N/A'}</span>
                  </div>
                  <div className="parameter-block span-2">
                    <span className="parameter-label">GST Registered</span>
                    <span className="parameter-value">{renderValue(extraFields.business_is_gst_registered)}</span>
                  </div>
                </>
              )}

              {extraFields.primary_role === 'Unemployed' && (
                <>
                  <div className="parameter-block">
                    <span className="parameter-label">Duration</span>
                    <span className="parameter-value">{extraFields.unemployed_duration || 'N/A'}</span>
                  </div>
                  <div className="parameter-block">
                    <span className="parameter-label">Exchange Registered</span>
                    <span className="parameter-value">{renderValue(extraFields.unemployed_registered_exchange)}</span>
                  </div>
                </>
              )}

              {extraFields.primary_role === 'Retired / Pensioner' && (
                <>
                  <div className="parameter-block">
                    <span className="parameter-label">Receives Pension</span>
                    <span className="parameter-value">{renderValue(extraFields.retired_is_pensioner)}</span>
                  </div>
                  {extraFields.retired_is_pensioner === 'Yes' && (
                    <div className="parameter-block">
                      <span className="parameter-label">Monthly Pension</span>
                      <span className="parameter-value" style={{ color: '#10B981' }}>₹{extraFields.retired_pension_amount || 'N/A'}</span>
                    </div>
                  )}
                </>
              )}

              <div className="parameter-block">
                <span className="parameter-label">Is Ex-Serviceman</span>
                <span className="parameter-value">{renderValue(extraFields.is_ex_serviceman)}</span>
              </div>
              <div className="parameter-block">
                <span className="parameter-label">Is Senior Citizen</span>
                <span className="parameter-value">{renderValue(extraFields.is_senior_citizen)}</span>
              </div>
            </div>
          </div>

          {/* Section 6: Documents & Interests */}
          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper section-icon-green"><FiCheckCircle size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Documentation & Interests</h3>
              </div>
            </div>
            <div className="parameter-grid">
              <div className="parameter-block">
                <span className="parameter-label">Has Aadhaar</span>
                <span className="parameter-value">{renderValue(extraFields.has_aadhaar)}</span>
              </div>
              <div className="parameter-block">
                <span className="parameter-label">Has Bank Account</span>
                <span className="parameter-value">{renderValue(extraFields.has_bank_account)}</span>
              </div>
              <div className="parameter-block span-2" style={{ alignItems: 'flex-start', gap: '0.625rem' }}>
                <span className="parameter-label">Certificates Available</span> 
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', width: '100%' }}>
                  {extraFields.certificates && extraFields.certificates.length > 0 ? (
                    extraFields.certificates.map(c => (
                      <span key={c} className="badge badge-primary">{c}</span>
                    ))
                  ) : (
                    <span className="badge badge-empty">None selected</span>
                  )}
                </div>
              </div>
              <div className="parameter-block span-2" style={{ alignItems: 'flex-start', gap: '0.625rem' }}>
                <span className="parameter-label">Scheme Category Interests</span> 
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', width: '100%' }}>
                  {extraFields.scheme_interest && extraFields.scheme_interest.length > 0 ? (
                    extraFields.scheme_interest.map(i => (
                      <span key={i} className="badge badge-accent">{i}</span>
                    ))
                  ) : (
                    <span className="badge badge-empty">None selected</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
