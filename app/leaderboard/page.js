import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

function RankBadge({ rank }) {
  const styles =
    rank === 1
      ? {
        background: 'rgba(250, 204, 21, 0.16)',
        border: '1px solid rgba(250, 204, 21, 0.35)',
        color: '#facc15',
      }
      : rank === 2
        ? {
          background: 'rgba(148, 163, 184, 0.16)',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          color: '#cbd5e1',
        }
        : rank === 3
          ? {
            background: 'rgba(251, 146, 60, 0.16)',
            border: '1px solid rgba(251, 146, 60, 0.35)',
            color: '#fb923c',
          }
          : {
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--panel-border)',
            color: 'var(--text-main)',
          };

  return (
    <div
      style={{
        minWidth: '52px',
        height: '52px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: '1rem',
        ...styles,
      }}
    >
      #{rank}
    </div>
  );
}

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  let currentUsername = user.user_metadata?.username ?? null;

  if (!currentUsername) {
    const { data: profile } = await supabase
      .from('users')
      .select('username')
      .eq('user_id', user.id)
      .single();

    currentUsername = profile?.username ?? '';
  }

  const { data: leaderData } = await supabase
    .from('leaderboard')
    .select('*')
    .order('total_points', { ascending: false })
    .order('predictions_count', { ascending: false })
    .order('username', { ascending: true });

  const rows = leaderData || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>
          Leaderboard
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Rankings based on total points earned from predictions.
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
          No participants yet. Be the first one on the board.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rows.map((row, index) => {
            const rank = index + 1;
            const isCurrentUser = row.username === currentUsername;

            return (
              <div
                key={row.username}
                className="glass-panel"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  justifyContent: 'space-between',
                  border: isCurrentUser
                    ? '1px solid rgba(59, 130, 246, 0.4)'
                    : '1px solid var(--panel-border)',
                  boxShadow: isCurrentUser
                    ? '0 0 0 1px rgba(59, 130, 246, 0.12)'
                    : 'none',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <RankBadge rank={rank} />

                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {(row.username || 'U')[0].toUpperCase()}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                      {row.username}
                      {isCurrentUser ? (
                        <span
                          style={{
                            marginLeft: '0.5rem',
                            fontSize: '0.75rem',
                            color: 'var(--accent-blue)',
                            fontWeight: 700,
                          }}
                        >
                          You
                        </span>
                      ) : null}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {row.predictions_count ?? 0} prediction
                      {(row.predictions_count ?? 0) === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Points
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 900,
                      color: 'var(--accent-blue)',
                    }}
                  >
                    {row.total_points ?? 0}
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