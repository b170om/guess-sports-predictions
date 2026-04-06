'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateMatchResult,
  publishMatch,
  unpublishMatch,
  deleteMatch,
} from './actions';

export default function AdminMatchCard({ match }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [homeScore, setHomeScore] = useState(match.actual_home_score ?? '');
  const [awayScore, setAwayScore] = useState(match.actual_away_score ?? '');
  const [status, setStatus] = useState(match.status === 'finished' ? 'finished' : 'pending');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isFinished = status === 'finished';

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleUpdate = () => {
    resetMessages();

    startTransition(async () => {
      const formData = new FormData();
      formData.set('match_id', String(match.id));
      formData.set('actual_home_score', homeScore === '' ? '' : String(homeScore));
      formData.set('actual_away_score', awayScore === '' ? '' : String(awayScore));
      formData.set('status', status);

      const result = await updateMatchResult(formData);

      if (result?.error) {
        setErrorMsg(result.error);
        return;
      }

      setSuccessMsg('Match updated successfully.');
      router.refresh();
    });
  };

  const handlePublishToggle = () => {
    resetMessages();

    startTransition(async () => {
      const result = match.is_published
        ? await unpublishMatch(match.id)
        : await publishMatch(match.id);

      if (result?.error) {
        setErrorMsg(result.error);
        return;
      }

      setSuccessMsg(match.is_published ? 'Match unpublished.' : 'Match published.');
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm('Permanently delete this match?')) return;

    resetMessages();

    startTransition(async () => {
      const result = await deleteMatch(match.id);

      if (result?.error) {
        setErrorMsg(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div
      className="stitch-card animate-up"
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {new Date(match.match_datetime).toLocaleString()}
          </span>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>
            {match.home_team} vs {match.away_team}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {match.is_published ? (
            <span className="stitch-badge primary">PUBLISHED</span>
          ) : (
            <span className="stitch-badge">DRAFT</span>
          )}

          {match.status === 'finished' ? (
            <span className="stitch-badge success">FINISHED</span>
          ) : (
            <span className="stitch-badge">PENDING</span>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <label
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
            }}
          >
            {match.home_team}
          </label>
          <input
            type="number"
            className="stitch-input"
            placeholder="-"
            value={homeScore}
            disabled={isPending || !isFinished}
            onChange={(e) => setHomeScore(e.target.value)}
            style={{
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '1.15rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <label
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
            }}
          >
            {match.away_team}
          </label>
          <input
            type="number"
            className="stitch-input"
            placeholder="-"
            value={awayScore}
            disabled={isPending || !isFinished}
            onChange={(e) => setAwayScore(e.target.value)}
            style={{
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '1.15rem',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <label
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontWeight: 700,
          }}
        >
          Match State
        </label>
        <select
          className="stitch-input stitch-select"
          value={status}
          disabled={isPending}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="finished">Finished</option>
        </select>
      </div>

      {!isFinished && (
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          Scores are only saved when the match state is set to <strong>Finished</strong>.
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            color: 'var(--error)',
            fontSize: '0.85rem',
            lineHeight: 1.5,
          }}
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            color: 'var(--success)',
            fontSize: '0.85rem',
            lineHeight: 1.5,
          }}
        >
          {successMsg}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginTop: '0.25rem',
        }}
      >
        <button
          type="button"
          onClick={handleUpdate}
          disabled={isPending}
          className="stitch-button primary"
          style={{ flex: '1 1 140px' }}
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={handlePublishToggle}
          disabled={isPending}
          className="stitch-button secondary"
          style={{ flex: '1 1 140px' }}
        >
          {match.is_published ? 'Unpublish' : 'Publish'}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="stitch-button danger"
          style={{ flex: '1 1 140px' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}