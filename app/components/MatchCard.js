'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

function formatKickoff(dateStr) {
  const d = new Date(dateStr);

  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCountdown(ms) {
  if (ms <= 0) return '0m';

  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getStatusMeta(displayStatus, hasConfirmedSaved) {
  if (displayStatus === 'in_progress') {
    return { label: 'Live', className: 'success' };
  }

  if (displayStatus === 'finished') {
    return { label: 'Locked', className: 'error' };
  }

  if (hasConfirmedSaved) {
    return { label: 'Saved', className: 'primary' };
  }

  return { label: 'Open', className: '' };
}

function TeamBadge({ teamName, crestUrl, accent }) {
  const [imgFailed, setImgFailed] = useState(false);

  const showImage = crestUrl && !imgFailed;

  return (
    <div
      style={{
        width: '64px',
        height: '64px',
        borderRadius: '20px',
        background: 'rgba(6, 14, 32, 0.95)',
        border: '1px solid rgba(140, 144, 159, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}
    >
      {showImage ? (
        <img
          src={crestUrl}
          alt={`${teamName} logo`}
          onError={() => setImgFailed(true)}
          style={{
            width: '70%',
            height: '70%',
            objectFit: 'contain',
          }}
        />
      ) : (
        <span
          style={{
            fontSize: '1.4rem',
            fontWeight: 900,
            color: accent,
          }}
        >
          {teamName?.[0]?.toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
}

function toLocalPrediction(prediction) {
  if (!prediction) return null;

  return {
    match_id: prediction.match_id,
    predicted_home_score: prediction.predicted_home_score?.toString() ?? '',
    predicted_away_score: prediction.predicted_away_score?.toString() ?? '',
  };
}

export default function MatchCard({ match, existingPrediction, currentUser }) {
  const supabase = useMemo(() => createClient(), []);
  const [saveState, setSaveState] = useState(existingPrediction ? 'saved' : 'idle');
  const [savedPrediction, setSavedPrediction] = useState(() => toLocalPrediction(existingPrediction));
  const [homeScore, setHomeScore] = useState(
    existingPrediction?.predicted_home_score?.toString() ?? ''
  );
  const [awayScore, setAwayScore] = useState(
    existingPrediction?.predicted_away_score?.toString() ?? ''
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    const nextSavedPrediction = toLocalPrediction(existingPrediction);

    setSavedPrediction(nextSavedPrediction);
    setSaveState(nextSavedPrediction ? 'saved' : 'idle');
    setHomeScore(nextSavedPrediction?.predicted_home_score ?? '');
    setAwayScore(nextSavedPrediction?.predicted_away_score ?? '');
    setErrorMsg('');
  }, [
    existingPrediction?.match_id,
    existingPrediction?.predicted_home_score,
    existingPrediction?.predicted_away_score,
  ]);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const kickoffTs = new Date(match.match_datetime).getTime();
  const displayStatus =
    match.status === 'finished'
      ? 'finished'
      : nowTs >= kickoffTs
        ? 'in_progress'
        : 'pending';

  const isLocked = displayStatus !== 'pending';
  const savedHome = savedPrediction?.predicted_home_score ?? '';
  const savedAway = savedPrediction?.predicted_away_score ?? '';
  const hasSavedPrediction = !!savedPrediction;
  const isEmpty = homeScore === '' || awayScore === '';
  const isDirty = homeScore !== savedHome || awayScore !== savedAway;
  const hasConfirmedSaved = hasSavedPrediction && !isDirty && !isLocked;

  const statusMeta = getStatusMeta(displayStatus, hasConfirmedSaved);
  const countdownText =
    displayStatus === 'pending' ? formatCountdown(kickoffTs - nowTs) : null;

  const helperText = isLocked
    ? ''
    : hasSavedPrediction
      ? isDirty
        ? 'You changed your saved prediction. Click update to save the new score.'
        : 'Prediction saved. You can still edit it until kickoff.'
      : 'You can submit one prediction and update it until kickoff.';

  const handleSave = async () => {
    if (!currentUser || isLocked || isEmpty || saveState === 'loading') return;

    setSaveState('loading');
    setErrorMsg('');

    const normalizedHome = parseInt(homeScore, 10);
    const normalizedAway = parseInt(awayScore, 10);

    const { error } = await supabase.from('predictions').upsert(
      {
        username: currentUser,
        match_id: match.id,
        predicted_home_score: normalizedHome,
        predicted_away_score: normalizedAway,
      },
      { onConflict: 'username,match_id' }
    );

    if (error) {
      setErrorMsg(error.message.includes('RLS') ? 'Locked after kickoff' : error.message);
      setSaveState('error');
      return;
    }

    setSavedPrediction({
      match_id: match.id,
      predicted_home_score: normalizedHome.toString(),
      predicted_away_score: normalizedAway.toString(),
    });
    setSaveState('saved');
  };

  const buttonLabel = isLocked
    ? 'Closed'
    : saveState === 'loading'
      ? 'Saving...'
      : hasSavedPrediction
        ? isDirty
          ? 'Update Prediction'
          : 'Saved'
        : 'Submit Prediction';

  const buttonDisabled =
    isLocked ||
    saveState === 'loading' ||
    isEmpty ||
    (hasSavedPrediction && !isDirty);

  const buttonClassName =
    hasSavedPrediction && !isDirty
      ? 'stitch-button secondary'
      : 'stitch-button primary';

  const buttonStyle =
    hasSavedPrediction && !isDirty
      ? {
        background: 'rgba(0, 165, 114, 0.16)',
        color: '#8cf4cc',
        border: '1px solid rgba(78, 222, 163, 0.18)',
      }
      : isLocked
        ? { opacity: 0.65 }
        : {};

  return (
    <div
      className="stitch-card animate-up"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        minHeight: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {formatKickoff(match.match_datetime)}
        </div>

        <span className={`stitch-badge ${statusMeta.className}`.trim()}>
          {statusMeta.label}
        </span>
      </div>

      {countdownText ? (
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            marginTop: '-0.15rem',
            marginBottom: '0.1rem',
          }}
        >
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Starts In
          </span>

          <span
            style={{
              fontSize: '1.05rem',
              fontWeight: 900,
              color: 'var(--success)',
              lineHeight: 1.1,
            }}
          >
            {countdownText}
          </span>
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.85rem',
            textAlign: 'center',
            minWidth: 0,
          }}
        >
          <TeamBadge
            teamName={match.home_team}
            crestUrl={match.home_team_crest_url}
            accent="var(--primary)"
          />

          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              wordBreak: 'break-word',
            }}
          >
            {match.home_team}
          </div>

          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={homeScore}
            onChange={(e) => {
              setHomeScore(e.target.value);
              setErrorMsg('');
              if (saveState !== 'loading') {
                setSaveState('idle');
              }
            }}
            disabled={isLocked || saveState === 'loading'}
            className="stitch-input score-input"
            aria-label={`${match.home_team} predicted score`}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            minWidth: '44px',
          }}
        >
          <div
            style={{
              fontSize: '1.35rem',
              fontWeight: 900,
              color: 'rgba(173, 198, 255, 0.32)',
              letterSpacing: '0.08em',
            }}
          >
            VS
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.85rem',
            textAlign: 'center',
            minWidth: 0,
          }}
        >
          <TeamBadge
            teamName={match.away_team}
            crestUrl={match.away_team_crest_url}
            accent="var(--accent-violet)"
          />

          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              wordBreak: 'break-word',
            }}
          >
            {match.away_team}
          </div>

          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={awayScore}
            onChange={(e) => {
              setAwayScore(e.target.value);
              setErrorMsg('');
              if (saveState !== 'loading') {
                setSaveState('idle');
              }
            }}
            disabled={isLocked || saveState === 'loading'}
            className="stitch-input score-input"
            aria-label={`${match.away_team} predicted score`}
          />
        </div>
      </div>

      <div style={{ marginTop: '0.25rem' }}>
        {errorMsg ? (
          <div
            style={{
              color: 'var(--error)',
              fontSize: '0.8rem',
              marginBottom: '0.75rem',
              lineHeight: 1.5,
            }}
          >
            {errorMsg}
          </div>
        ) : helperText ? (
          <div
            style={{
              color: hasSavedPrediction && !isDirty ? '#8cf4cc' : 'var(--text-muted)',
              fontSize: '0.8rem',
              marginBottom: '0.75rem',
              lineHeight: 1.5,
            }}
          >
            {helperText}
          </div>
        ) : null}

        <button
          onClick={handleSave}
          disabled={buttonDisabled}
          className={buttonClassName}
          style={buttonStyle}
        >
          {isLocked ? (
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
              lock
            </span>
          ) : hasSavedPrediction && !isDirty ? (
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
              check_circle
            </span>
          ) : null}
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}