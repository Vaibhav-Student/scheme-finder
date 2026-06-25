import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Admin.css';

const EMPTY_SCHEME = {
  name: '', description: '', benefits: '', required_documents: [],
  apply_link: '', last_date: '', ministry: '', scheme_type: 'Scholarship',
  is_active: true, source_url: '',
  eligibility: {
    min_age: '', max_age: '', gender: '', disability_types: [],
    min_disability_pct: 40, states: [], categories: [],
    max_family_income: '', education_levels: [],
  },
};

const SCHEME_TYPES = ['Scholarship', 'Pension', 'Assistive Device', 'Employment', 'Skill Training', 'Financial Assistance', 'Other'];
const DISABILITY_TYPES = ['Locomotor', 'Visual', 'Hearing', 'Intellectual', 'Mental Illness', 'Multiple Disabilities'];
const CATEGORIES = ['SC', 'ST', 'OBC', 'General'];
const EDUCATION_LEVELS = ['Pre-Primary', 'Primary', 'Secondary', 'Higher Secondary', 'Graduate', 'Post-Graduate'];

export default function ManageSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [form, setForm] = useState(EMPTY_SCHEME);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [filterTab, setFilterTab] = useState('active');

  const fetchSchemes = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/schemes');
      const data = await res.json();
      setSchemes(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load schemes from database'); }
    setLoading(false);
  };

  useEffect(() => { fetchSchemes(); }, []);

  const filtered = schemes.filter(
    (s) => (filterTab === 'active' ? s.is_active : !s.is_active) && 
           (s.name.toLowerCase().includes(search.toLowerCase()) || s.ministry?.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openAdd = () => { setEditingScheme(null); setForm(EMPTY_SCHEME); setShowModal(true); };
  const openEdit = (scheme) => {
    setEditingScheme(scheme);
    setForm({
      ...scheme,
      last_date: scheme.last_date || '',
      required_documents: scheme.required_documents || [],
      eligibility: scheme.eligibility || EMPTY_SCHEME.eligibility,
    });
    setShowModal(true);
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this scheme? It will be moved to the deactivated logs.')) return;
    try {
      await fetch(`http://localhost:5000/api/schemes/${id}/deactivate`, { method: 'PUT' });
      toast.success('Scheme deactivated');
      fetchSchemes();
    } catch { toast.error('Failed to deactivate'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      required_documents: typeof form.required_documents === 'string'
        ? form.required_documents.split(',').map((d) => d.trim()).filter(Boolean)
        : form.required_documents,
      eligibility: {
        ...form.eligibility,
        min_age: form.eligibility.min_age || null,
        max_age: form.eligibility.max_age || null,
        gender: form.eligibility.gender || null,
        max_family_income: form.eligibility.max_family_income || null,
        disability_types: form.eligibility.disability_types?.length ? form.eligibility.disability_types : null,
        states: form.eligibility.states?.length ? form.eligibility.states : null,
        categories: form.eligibility.categories?.length ? form.eligibility.categories : null,
        education_levels: form.eligibility.education_levels?.length ? form.eligibility.education_levels : null,
      },
    };
    try {
      if (editingScheme) {
        await fetch(`http://localhost:5000/api/schemes/${editingScheme.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        toast.success('Scheme updated');
      } else {
        await fetch('http://localhost:5000/api/schemes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        toast.success('Scheme created');
      }
      setShowModal(false);
      fetchSchemes();
    } catch (err) {
      toast.error('Failed to save scheme');
    }
    setSaving(false);
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateEligibility = (field, value) =>
    setForm((prev) => ({ ...prev, eligibility: { ...prev.eligibility, [field]: value } }));

  const toggleArrayItem = (field, item, isEligibility = false) => {
    const target = isEligibility ? form.eligibility : form;
    const arr = target[field] || [];
    const updated = arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
    if (isEligibility) updateEligibility(field, updated);
    else updateField(field, updated);
  };

  if (loading) return <LoadingSpinner message="Loading schemes..." />;

  return (
    <div className="admin-container container" role="main" aria-label="Manage Schemes">
      <h1 className="admin-title">Manage Schemes</h1>

      <div className="search-wrapper" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-bar" style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="search" className="input-field" style={{ paddingLeft: 42, width: '100%' }}
              placeholder="Search schemes..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              aria-label="Search schemes" id="admin-scheme-search"
            />
          </div>
          <button className="btn btn-primary action-btn" onClick={openAdd} id="add-scheme-btn">
            <FiPlus size={18} /> Add Scheme
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <button 
            className={`btn ${filterTab === 'active' ? 'btn-primary' : 'btn-outline'}`} 
            style={{ borderRadius: '20px', padding: '0.4rem 1.2rem' }}
            onClick={() => { setFilterTab('active'); setPage(1); }}
          >
            Active Schemes
          </button>
          <button 
            className={`btn ${filterTab === 'deactivated' ? 'btn-danger' : 'btn-outline'}`} 
            style={{ borderRadius: '20px', padding: '0.4rem 1.2rem' }}
            onClick={() => { setFilterTab('deactivated'); setPage(1); }}
          >
            Deactivated Logs
          </button>
        </div>
      </div>

      <div className="table-wrapper card">
        <table className="data-table" aria-label="Schemes list">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Ministry</th>
              <th>Active</th>
              <th>Last Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((s) => (
              <tr key={s.id}>
                <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</td>
                <td><span className="badge badge-primary">{s.scheme_type}</span></td>
                <td>{s.ministry}</td>
                <td><span className={s.is_active ? 'scheme-active' : 'scheme-inactive'}>{s.is_active ? 'Yes' : 'No'}</span></td>
                <td>{s.last_date || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline" onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`}><FiEdit2 size={14} /></button>
                    {s.is_active && (
                      <button className="btn btn-danger" onClick={() => handleDeactivate(s.id)} aria-label={`Deactivate ${s.name}`}>Deactivate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No schemes found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i + 1} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-label={editingScheme ? 'Edit Scheme' : 'Add Scheme'}>
            <div className="modal-header">
              <h2>{editingScheme ? 'Edit Scheme' : 'Add New Scheme'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close modal"><FiX /></button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="scheme-name">Scheme Name *</label>
                <input id="scheme-name" className="input-field" required value={form.name} onChange={(e) => updateField('name', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="scheme-type">Type</label>
                  <select id="scheme-type" className="select-field" value={form.scheme_type} onChange={(e) => updateField('scheme_type', e.target.value)}>
                    {SCHEME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="scheme-ministry">Ministry</label>
                  <input id="scheme-ministry" className="input-field" value={form.ministry} onChange={(e) => updateField('ministry', e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="scheme-desc">Description</label>
                <textarea id="scheme-desc" className="input-field" rows={3} value={form.description} onChange={(e) => updateField('description', e.target.value)} />
              </div>
              <div className="input-group">
                <label htmlFor="scheme-benefits">Benefits *</label>
                <textarea id="scheme-benefits" className="input-field" rows={2} required value={form.benefits} onChange={(e) => updateField('benefits', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="scheme-apply">Apply Link</label>
                  <input id="scheme-apply" className="input-field" value={form.apply_link} onChange={(e) => updateField('apply_link', e.target.value)} />
                </div>
                <div className="input-group">
                  <label htmlFor="scheme-date">Last Date</label>
                  <input id="scheme-date" type="date" className="input-field" value={form.last_date} onChange={(e) => updateField('last_date', e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="scheme-docs">Required Documents (comma-separated)</label>
                <input id="scheme-docs" className="input-field"
                  value={Array.isArray(form.required_documents) ? form.required_documents.join(', ') : form.required_documents}
                  onChange={(e) => updateField('required_documents', e.target.value)} />
              </div>
              <label className="active-toggle"><input type="checkbox" checked={form.is_active} onChange={(e) => updateField('is_active', e.target.checked)} /> Active</label>

              <h3 style={{ marginTop: 8, fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Eligibility Criteria</h3>
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="elig-min-age">Min Age</label>
                  <input id="elig-min-age" type="number" className="input-field" value={form.eligibility.min_age} onChange={(e) => updateEligibility('min_age', e.target.value)} />
                </div>
                <div className="input-group">
                  <label htmlFor="elig-max-age">Max Age</label>
                  <input id="elig-max-age" type="number" className="input-field" value={form.eligibility.max_age} onChange={(e) => updateEligibility('max_age', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="elig-min-pct">Min Disability %</label>
                  <input id="elig-min-pct" type="number" className="input-field" value={form.eligibility.min_disability_pct} onChange={(e) => updateEligibility('min_disability_pct', parseInt(e.target.value) || 0)} />
                </div>
                <div className="input-group">
                  <label htmlFor="elig-income">Max Family Income (₹)</label>
                  <input id="elig-income" type="number" className="input-field" value={form.eligibility.max_family_income} onChange={(e) => updateEligibility('max_family_income', e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>Disability Types (select applicable)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DISABILITY_TYPES.map((dt) => (
                    <label key={dt} className="active-toggle"><input type="checkbox" checked={form.eligibility.disability_types?.includes(dt) || false} onChange={() => toggleArrayItem('disability_types', dt, true)} /> {dt}</label>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label>Categories</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES.map((c) => (
                    <label key={c} className="active-toggle"><input type="checkbox" checked={form.eligibility.categories?.includes(c) || false} onChange={() => toggleArrayItem('categories', c, true)} /> {c}</label>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label>Education Levels</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {EDUCATION_LEVELS.map((el) => (
                    <label key={el} className="active-toggle"><input type="checkbox" checked={form.eligibility.education_levels?.includes(el) || false} onChange={() => toggleArrayItem('education_levels', el, true)} /> {el}</label>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editingScheme ? 'Update Scheme' : 'Create Scheme'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
