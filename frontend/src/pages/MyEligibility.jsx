import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiFileText, FiMapPin, FiBriefcase, FiDollarSign, FiEdit2, 
  FiHeart, FiCheckCircle, FiLayers 
} from 'react-icons/fi';
import './MyEligibility.css';

const API_BASE = 'http://localhost:5000/api';

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

  // Parse extra fields safely
  const extraFields = profile.extra_fields 
    ? (typeof profile.extra_fields === 'string' ? JSON.parse(profile.extra_fields) : profile.extra_fields)
    : {};

  return (
    <main id="main-content" className="eligibility-page">
      <div className="container" style={{ maxWidth: '1000px' }}>
        <header className="page-header animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="page-title">My Eligibility Profile</h1>
            <p className="eligibility-subtitle">The data you submitted to find matching schemes.</p>
          </div>
          <button className="btn btn-outline" onClick={() => navigate('/finder')}>
            <FiEdit2 size={18} /> Update Data
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
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><strong style={{ color: 'var(--text-muted)' }}>Full Name:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.full_name}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Date of Birth:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.dob || 'N/A'}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Age:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.age}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Gender:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.gender}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Marital Status:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.marital_status || 'N/A'}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Number of Children:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.num_children ?? 'N/A'}</span></li>
            </ul>
          </div>

          {/* Section 2: Location */}
          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper section-icon-green"><FiMapPin size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Location & Residence</h3>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><strong style={{ color: 'var(--text-muted)' }}>State:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.state}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>District:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.district}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Area Type:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.area_type || 'N/A'}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Housing Status:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.housing_status || 'N/A'}</span></li>
            </ul>
          </div>

          {/* Section 3: Socio-Economic */}
          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><FiDollarSign size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Socio-Economic & Caste</h3>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><strong style={{ color: 'var(--text-muted)' }}>Caste Category:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.category}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Minority Status:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.is_minority || 'No'}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Annual Income:</strong> <span style={{ float: 'right', fontWeight: 500 }}>₹{profile.family_income?.toLocaleString() || 'N/A'}</span></li>
            </ul>
          </div>

          {/* Section 4: Disability */}
          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}><FiHeart size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Disability Status</h3>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><strong style={{ color: 'var(--text-muted)' }}>Has Disability:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.has_disability ? 'Yes' : 'No'}</span></li>
              {profile.has_disability ? (
                <>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Type:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.disability_type}</span></li>
                  {profile.udid_number && <li><strong style={{ color: 'var(--text-muted)' }}>UDID:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.udid_number}</span></li>}
                </>
              ) : null}
            </ul>
          </div>

          {/* Section 5: Employment & Profile */}
          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper section-icon-blue"><FiBriefcase size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Professional Profile</h3>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><strong style={{ color: 'var(--text-muted)' }}>Highest Education:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.education_level || 'N/A'}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Primary Activity / Role:</strong> <span style={{ float: 'right', fontWeight: 600, color: 'var(--color-primary-raw)' }}>{extraFields.primary_role || 'N/A'}</span></li>
              
              {/* Conditional Nested details */}
              {extraFields.primary_role === 'Student' && (
                <>
                  <li><strong style={{ color: 'var(--text-muted)' }}>School / College:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.student_school_name || 'N/A'}</span></li>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Course / Class:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.student_course_name || 'N/A'}</span></li>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Is Hosteller:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.student_is_hosteller || 'No'}</span></li>
                </>
              )}

              {extraFields.primary_role === 'Farmer' && (
                <>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Land Size (Acres):</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.farmer_land_size || 'N/A'}</span></li>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Crop Type:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.farmer_crop_type || 'N/A'}</span></li>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Farmer Category:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.farmer_category || 'N/A'}</span></li>
                </>
              )}

              {extraFields.primary_role === 'Salaried Employee' && (
                <>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Employer Sector:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.employee_sector || 'N/A'}</span></li>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Organization:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.employee_org_name || 'N/A'}</span></li>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Monthly Salary:</strong> <span style={{ float: 'right', fontWeight: 500 }}>₹{extraFields.employee_monthly_salary || 'N/A'}</span></li>
                </>
              )}

              {extraFields.primary_role === 'Business Owner / Self-Employed' && (
                <>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Business Sector:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.business_sector || 'N/A'}</span></li>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Annual Turnover:</strong> <span style={{ float: 'right', fontWeight: 500 }}>₹{extraFields.business_turnover || 'N/A'}</span></li>
                  <li><strong style={{ color: 'var(--text-muted)' }}>GST Registered:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.business_is_gst_registered || 'No'}</span></li>
                </>
              )}

              {extraFields.primary_role === 'Unemployed' && (
                <>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Duration:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.unemployed_duration || 'N/A'}</span></li>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Exchange Registered:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.unemployed_registered_exchange || 'No'}</span></li>
                </>
              )}

              {extraFields.primary_role === 'Retired / Pensioner' && (
                <>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Receives Pension:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.retired_is_pensioner || 'No'}</span></li>
                  {extraFields.retired_is_pensioner === 'Yes' && (
                    <li><strong style={{ color: 'var(--text-muted)' }}>Monthly Pension:</strong> <span style={{ float: 'right', fontWeight: 500 }}>₹{extraFields.retired_pension_amount || 'N/A'}</span></li>
                  )}
                </>
              )}

              <li><strong style={{ color: 'var(--text-muted)' }}>Is Ex-Serviceman:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.is_ex_serviceman || 'No'}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Is Senior Citizen:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.is_senior_citizen || 'No'}</span></li>
            </ul>
          </div>

          {/* Section 6: Documents & Interests */}
          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper section-icon-green"><FiCheckCircle size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Documentation & Interests</h3>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><strong style={{ color: 'var(--text-muted)' }}>Has Aadhaar:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.has_aadhaar || 'Yes'}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Has Bank Account:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{extraFields.has_bank_account || 'Yes'}</span></li>
              <li>
                <strong style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Certificates Available:</strong> 
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {extraFields.certificates && extraFields.certificates.length > 0 ? (
                    extraFields.certificates.map(c => (
                      <span key={c} className="badge badge-primary">{c}</span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>None selected</span>
                  )}
                </div>
              </li>
              <li>
                <strong style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Scheme Category Interests:</strong> 
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {extraFields.scheme_interest && extraFields.scheme_interest.length > 0 ? (
                    extraFields.scheme_interest.map(i => (
                      <span key={i} className="badge badge-accent">{i}</span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>None selected</span>
                  )}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
