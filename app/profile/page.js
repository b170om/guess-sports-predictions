import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

function StatCard({ label, value, accent }) {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        minHeight: '110px',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: '1.9rem',
          fontWeight: 800,
          color: accent || 'var(--text-main)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('username, email, role, profile_image')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/');
  }

  const username = profile.username || user.user_metadata?.username || null;

  if (!username) {
    redirect('/');
  }

  const [
    { data: leaderboardEntries, error: leaderboardError },
    { data: predictionRows, error: predictionError },
  ] = await Promise.all([
    supabase
      .from('leaderboard')
      .select('*')
      .order('total_points', { ascending: false })
      .order('predictions_count', { ascending: false })
      .order('username', { ascending: true }),

    supabase
      .from('predictions_with_points')
      .select('status, points_awarded')
      .eq('username', username),
  ]);

  if (leaderboardError) {
    console.error('Error loading leaderboard for profile:', leaderboardError.message);
  }

  if (predictionError) {
    console.error('Error loading prediction stats for profile:', predictionError.message);
  }

  const entries = leaderboardEntries || [];
  const currentEntry = entries.find((entry) => entry.username === username) || null;

  const rows = predictionRows || [];
  const finishedRows = rows.filter((row) => row.status === 'finished');

  const totalPredictions = currentEntry?.predictions_count ?? rows.length;
  const totalPoints =
    currentEntry?.total_points ??
    rows.reduce((sum, row) => sum + Number(row.points_awarded ?? 0), 0);

  const exactHits = finishedRows.filter(
    (row) => Number(row.points_awarded) === 3
  ).length;

  const correctOutcomeCount = finishedRows.filter(
    (row) => Number(row.points_awarded) >= 1
  ).length;

  const finishedPredictionsCount = finishedRows.length;

  const exactHitRate =
    finishedPredictionsCount > 0
      ? Math.round((exactHits / finishedPredictionsCount) * 100)
      : 0;

  const outcomeAccuracyRate =
    finishedPredictionsCount > 0
      ? Math.round((correctOutcomeCount / finishedPredictionsCount) * 100)
      : 0;

  return (
    <div style={{ padding: '2rem 0', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Your Profile
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Track your account details and performance.
        </p>
      </div>

      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: '5.5rem',
              height: '5.5rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.1rem',
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {profile?.username ? profile.username[0].toUpperCase() : 'U'}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {profile?.username || 'Unknown'}
            </div>

            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.95rem',
                lineHeight: 1.8,
                wordBreak: 'break-word',
              }}
            >
              <div>{profile?.email || user.email || 'No email available'}</div>
              <div>
                Role:{' '}
                <span
                  style={{
                    color:
                      profile?.role === 'admin'
                        ? 'var(--accent-blue)'
                        : 'var(--text-main)',
                  }}
                >
                  {profile?.role || 'user'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <StatCard label="Predictions Sent" value={totalPredictions} />
        <StatCard label="Total Points" value={totalPoints} accent="var(--success)" />
        <StatCard label="Exact Hits" value={exactHits} accent="var(--accent-blue)" />
        <StatCard label="Correct Outcome" value={correctOutcomeCount} accent="var(--accent-violet)" />
        <StatCard label="Exact Hit Rate" value={`${exactHitRate}%`} accent="var(--accent-blue)" />
        <StatCard label="Outcome Accuracy" value={`${outcomeAccuracyRate}%`} accent="var(--success)" />
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.6rem' }}>
          Performance Summary
        </div>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.7 }}>
          You have submitted{' '}
          <strong style={{ color: 'var(--text-main)' }}>{totalPredictions}</strong> prediction
          {totalPredictions === 1 ? '' : 's'}, earned{' '}
          <strong style={{ color: 'var(--text-main)' }}>{totalPoints}</strong> point
          {totalPoints === 1 ? '' : 's'}, hit the exact score{' '}
          <strong style={{ color: 'var(--text-main)' }}>{exactHits}</strong> time
          {exactHits === 1 ? '' : 's'}, and predicted the correct overall outcome{' '}
          <strong style={{ color: 'var(--text-main)' }}>{correctOutcomeCount}</strong> time
          {correctOutcomeCount === 1 ? '' : 's'}.
        </p>

        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
            marginTop: '0.9rem',
            lineHeight: 1.7,
          }}
        >
          Your exact hit rate is{' '}
          <strong style={{ color: 'var(--text-main)' }}>{exactHitRate}%</strong>, and your overall
          outcome accuracy is{' '}
          <strong style={{ color: 'var(--text-main)' }}>{outcomeAccuracyRate}%</strong>. These
          percentages are based only on finished matches.
        </p>
      </div>
    </div>
  );
}