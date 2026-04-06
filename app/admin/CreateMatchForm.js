'use client';

import { useEffect, useRef, useState } from 'react';
import { createMatch } from './actions';

function toLocalDateTimeInputValue(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function CreateMatchForm() {
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [matchDateTime, setMatchDateTime] = useState('');
  const [minDateTime, setMinDateTime] = useState(toLocalDateTimeInputValue());

  useEffect(() => {
    const timer = setInterval(() => {
      setMinDateTime(toLocalDateTimeInputValue());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formEl = formRef.current;

    if (!formEl) {
      setErrorMsg('Form not ready. Please try again.');
      return;
    }

    if (!matchDateTime) {
      setErrorMsg('Please choose a match date and time.');
      return;
    }

    const selectedDate = new Date(matchDateTime);

    if (Number.isNaN(selectedDate.getTime())) {
      setErrorMsg('Invalid date and time.');
      return;
    }

    if (selectedDate.getTime() <= Date.now()) {
      setErrorMsg('Match date and time must be in the future.');
      return;
    }

    const formData = new FormData(formEl);
    formData.set('match_datetime', selectedDate.toISOString());

    setLoading(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const result = await createMatch(formData);

      if (result?.error) {
        setErrorMsg(result.error);
      } else {
        setSuccess(true);
        formEl.reset();
        setMatchDateTime('');
        setMinDateTime(toLocalDateTimeInputValue());
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Create match failed:', error);
      setErrorMsg('Something went wrong while creating the match.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 600 }}>
        Create New Match
      </h2>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}
      >
        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="home_team" style={{ fontSize: '0.85rem', color: 'var(--outline)' }}>
            Home Team
          </label>
          <input
            required
            type="text"
            id="home_team"
            name="home_team"
            placeholder="e.g. Real Madrid"
            style={{
              padding: '0.6rem',
              borderRadius: '8px',
              background: 'var(--surface-container-highest)',
              border: '1px solid var(--outline-variant)',
              color: 'var(--on-surface)',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
          />
        </div>

        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="away_team" style={{ fontSize: '0.85rem', color: 'var(--outline)' }}>
            Away Team
          </label>
          <input
            required
            type="text"
            id="away_team"
            name="away_team"
            placeholder="e.g. Panathinaikos"
            style={{
              padding: '0.6rem',
              borderRadius: '8px',
              background: 'var(--surface-container-highest)',
              border: '1px solid var(--outline-variant)',
              color: 'var(--on-surface)',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
          />
        </div>

        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="match_datetime" style={{ fontSize: '0.85rem', color: 'var(--outline)' }}>
            Date & Time
          </label>
          <input
            required
            type="datetime-local"
            id="match_datetime"
            name="match_datetime"
            value={matchDateTime}
            min={minDateTime}
            onChange={(e) => setMatchDateTime(e.target.value)}
            style={{
              padding: '0.6rem',
              borderRadius: '8px',
              background: 'var(--surface-container-highest)',
              border: '1px solid var(--outline-variant)',
              color: 'var(--on-surface)',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ padding: '0.6rem 1.5rem', height: 'max-content', borderRadius: '8px' }}
        >
          {loading ? 'Adding...' : 'Add Match +'}
        </button>
      </form>

      {errorMsg && (
        <div style={{ color: 'var(--error)', marginTop: '1rem', fontSize: '0.9rem' }}>
          {errorMsg}
        </div>
      )}

      {success && (
        <div style={{ color: 'var(--success)', marginTop: '1rem', fontSize: '0.9rem' }}>
          Match created successfully!
        </div>
      )}
    </div>
  );
}