import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiAward, FiFileText } from 'react-icons/fi';
import './SchemeCard.css';

const TYPE_COLORS = {
  Scholarship: 'badge-primary',
  Pension: 'badge-secondary',
  Grant: 'badge-accent',
  Allowance: 'badge-success',
  Aid: 'badge-warning',
};

function getDaysRemaining(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function SchemeCard({ scheme, style }) {
  const navigate = useNavigate();
  const daysLeft = getDaysRemaining(scheme.last_date);
  const badgeClass = TYPE_COLORS[scheme.scheme_type] || 'badge-primary';

  return (
    <article
      className="scheme-card card"
      style={style}
      onClick={() => navigate(`/scheme/${scheme.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/scheme/${scheme.id}`); }}
      tabIndex={0}
      role="link"
      aria-label={`View details for ${scheme.name}`}
      id={`scheme-card-${scheme.id}`}
    >
      <div className="scheme-card-icon-bg">
        <FiAward size={48} className="bg-icon" />
      </div>

      <div className="scheme-card-content">
        <div className="scheme-card-header">
          <span className={`badge ${badgeClass}`}>{scheme.scheme_type || 'Scheme'}</span>
          {daysLeft !== null && daysLeft >= 0 && (
            <span className={`scheme-deadline ${daysLeft <= 7 ? 'deadline-urgent' : ''}`}>
              <FiCalendar size={12} aria-hidden="true" />
              {daysLeft === 0 ? 'Last day!' : `${daysLeft}d left`}
            </span>
          )}
        </div>

        <h3 className="scheme-card-title">{scheme.name}</h3>
        
        {scheme.ministry && (
          <p className="scheme-card-ministry">{scheme.ministry}</p>
        )}

        <div className="scheme-card-benefits">
          <div className="benefit-line">
            <FiFileText size={14} className="benefit-icon" />
            <span>{scheme.benefits || 'Financial assistance and support for eligible individuals.'}</span>
          </div>
        </div>
      </div>

      <div className="scheme-card-footer">
        <span className="scheme-card-link">
          View Details
          <div className="link-arrow">
            <FiArrowRight size={14} aria-hidden="true" />
          </div>
        </span>
      </div>
    </article>
  );
}
