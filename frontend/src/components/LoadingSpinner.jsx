import './LoadingSpinner.css';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-spinner-container" role="status" aria-label={message}>
      <div className="spinner" />
      <p className="spinner-text">{message}</p>
    </div>
  );
}
