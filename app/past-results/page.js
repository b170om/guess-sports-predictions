import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/utils/auth/get-current-profile';

function getResultMeta(points) {
  if (points === 3) {
    return {
      label: 'Exact Hit',
      color: 'var(--success)',
      background: 'rgba(74, 222, 128, 0.12)',
      border: 'rgba(74, 222, 128, 0.35)',
    };
  }

  if (points === 1) {
    return {
      label: 'Correct Outcome',
      color: 'var(--accent-blue)',
      background: 'rgba(59, 130, 246, 0.12)',
      border: 'rgba(59, 130, 246, 0.35)',
    };
  }

  return {
    label: 'Miss',
    color: 'var(--text-muted)',
    background: 'rgba(255,255,255,0.04)',
    border: 'var(--panel-border)',
  };
}

function formatMatchDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function rowKey(row, index) {
  return `${row.username ?? 'user'}-${row.home_team ?? 'home'}-${row.away_team ?? 'away'}-${row.match_datetime ?? index}-${index}`;
}

export default async function PastResultsPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) redirect('/login');

  const username = profile?.username ?? '';

  if (!username) {
    redirect('/login');
  }

  const supabase = await createClient();

  const { data: predictions } = await supabase
    .from('predictions_with_points')
    .select(
      'username, home_team, away_team, predicted_home_score, predicted_away_score, actual_home_score, actual_away_score, points_awarded, status, match_datetime'
    )
    .eq('username', username)
    .eq('status', 'finished')
    .order('match_datetime', { ascending: false });

  const rows = predictions || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>
          Past Results
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          See your finished predictions, final scores, and awarded points.
        </p>
      </header>

      {rows.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          No finished matches yet. Your results will appear here once matches are completed.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rows.map((row, index) => {
            const points = Number(row.points_awarded ?? 0);
            const meta = getResultMeta(points);

            return (
              <div
                key={rowKey(row, index)}
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      {row.home_team} vs {row.away_team}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {formatMatchDate(row.match_datetime)}
                    </div>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.35rem 0.8rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: meta.color,
                      background: meta.background,
                      border: `1px solid ${meta.border}`,
                    }}
                  >
                    {meta.label}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      padding: '0.9rem',
                      borderRadius: '14px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--panel-border)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Your Prediction
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                      {row.predicted_home_score} - {row.predicted_away_score}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '0.9rem',
                      borderRadius: '14px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--panel-border)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Final Score
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                      {row.actual_home_score} - {row.actual_away_score}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '0.9rem',
                      borderRadius: '14px',
                      background: meta.background,
                      border: `1px solid ${meta.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Points Awarded
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: meta.color }}>
                      {points}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}