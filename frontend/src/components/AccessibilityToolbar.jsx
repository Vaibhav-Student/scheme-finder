import { useState, useCallback } from 'react';
import { FiEye, FiType, FiVolume2, FiSun, FiMoon, FiSettings } from 'react-icons/fi';
import './AccessibilityToolbar.css';

export default function AccessibilityToolbar() {
  const [expanded, setExpanded] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeFont, setLargeFont] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const toggleHighContrast = useCallback(() => {
    const next = !highContrast;
    setHighContrast(next);
    if (next) {
      document.body.setAttribute('data-contrast', 'high');
    } else {
      document.body.removeAttribute('data-contrast');
    }
  }, [highContrast]);

  const toggleLargeFont = useCallback(() => {
    const next = !largeFont;
    setLargeFont(next);
    if (next) {
      document.body.setAttribute('data-fontsize', 'large');
    } else {
      document.body.removeAttribute('data-fontsize');
    }
  }, [largeFont]);

  const toggleTTS = useCallback(() => {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    if (!next && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    localStorage.setItem('tts_enabled', JSON.stringify(next));
  }, [ttsEnabled]);

  const toggleTheme = useCallback(() => {
    const current = document.body.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }, []);

  return (
    <div className="a11y-toolbar" role="toolbar" aria-label="Accessibility options">
      <button
        className={`a11y-toggle ${expanded ? 'a11y-toggle-active' : ''}`}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label="Accessibility settings"
        id="a11y-toggle"
      >
        <FiSettings size={20} />
      </button>

      {expanded && (
        <div className="a11y-panel animate-slide-up" role="group" aria-label="Accessibility controls">
          <button
            className={`a11y-btn ${highContrast ? 'a11y-btn-active' : ''}`}
            onClick={toggleHighContrast}
            aria-label={`High contrast mode: ${highContrast ? 'on' : 'off'}`}
            aria-pressed={highContrast}
            id="a11y-contrast"
          >
            <FiEye size={18} />
            <span className="a11y-btn-label">Contrast</span>
          </button>

          <button
            className={`a11y-btn ${largeFont ? 'a11y-btn-active' : ''}`}
            onClick={toggleLargeFont}
            aria-label={`Large font mode: ${largeFont ? 'on' : 'off'}`}
            aria-pressed={largeFont}
            id="a11y-fontsize"
          >
            <FiType size={18} />
            <span className="a11y-btn-label">Font</span>
          </button>

          <button
            className={`a11y-btn ${ttsEnabled ? 'a11y-btn-active' : ''}`}
            onClick={toggleTTS}
            aria-label={`Text to speech: ${ttsEnabled ? 'on' : 'off'}`}
            aria-pressed={ttsEnabled}
            id="a11y-tts"
          >
            <FiVolume2 size={18} />
            <span className="a11y-btn-label">Speech</span>
          </button>

          <button
            className="a11y-btn"
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            id="a11y-theme"
          >
            <FiSun size={18} />
            <span className="a11y-btn-label">Theme</span>
          </button>
        </div>
      )}
    </div>
  );
}
