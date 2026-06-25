import { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause, FiSquare } from 'react-icons/fi';
import './TextToSpeech.css';

export default function TextToSpeech({ text }) {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [supported, setSupported] = useState(true);
  const utterRef = useRef(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSupported(false);
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const speak = () => {
    if (!supported || !text) return;

    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = 1;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => { setSpeaking(false); setPaused(false); };
    utter.onerror = () => { setSpeaking(false); setPaused(false); };
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  const pause = () => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setPaused(true);
  };

  const stop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  };

  if (!supported) {
    return (
      <div className="tts-unsupported" role="alert">
        <span>🔇 Text-to-Speech is not supported in this browser.</span>
      </div>
    );
  }

  return (
    <div className="tts-controls" role="group" aria-label="Text to speech controls">
      {speaking && <span className="tts-indicator" aria-hidden="true" />}
      <button
        className="btn btn-ghost btn-icon tts-btn"
        onClick={speaking && !paused ? pause : speak}
        aria-label={speaking && !paused ? 'Pause reading' : 'Start reading'}
        id="tts-play-pause"
      >
        {speaking && !paused ? <FiPause size={16} /> : <FiPlay size={16} />}
      </button>
      {speaking && (
        <button
          className="btn btn-ghost btn-icon tts-btn"
          onClick={stop}
          aria-label="Stop reading"
          id="tts-stop"
        >
          <FiSquare size={16} />
        </button>
      )}
      <select
        className="tts-speed"
        value={rate}
        onChange={(e) => setRate(parseFloat(e.target.value))}
        aria-label="Reading speed"
        id="tts-speed"
      >
        <option value={0.5}>0.5×</option>
        <option value={1}>1×</option>
        <option value={1.5}>1.5×</option>
      </select>
    </div>
  );
}
