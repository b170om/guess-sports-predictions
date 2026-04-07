import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getCurrentProfile } from '@/utils/auth/get-current-profile';
import MatchCard from './components/MatchCard';
import RefreshFeedButton from './components/RefreshFeedButton';

export default async function Home() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect('/login');
  }

  const username = profile?.username ?? null;

  if (!username) {
    redirect('/login');
  }

  const supabase = await createClient();

  const [
    { data: matchesData, error: matchesError },
    { data: predictionsData, error: predictionsError },
  ] = await Promise.all([
    supabase
      .from('matches')
      .select('*')
      .eq('is_published', true)
      .neq('status', 'finished')
      .order('match_datetime', { ascending: true }),

    supabase
      .from('predictions')
      .select('match_id, predicted_home_score, predicted_away_score')
      .eq('username', username),
  ]);

  if (matchesError) {
    console.error('Error loading matches:', matchesError.message);
  }

  if (predictionsError) {
    console.error('Error loading predictions:', predictionsError.message);
  }

  const matches = matchesData || [];
  const predictionsMap = {};

  (predictionsData || []).forEach((prediction) => {
    predictionsMap[prediction.match_id] = prediction;
  });

  if (matches.length === 0) {
    return (
      <div
        className="glass-card animate-up"
        style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          marginTop: '4rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'var(--surface-container-high)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>
            sports_soccer
          </span>
        </div>

        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
            No Active Matches
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            Check back later for new match schedules and tournament updates.
          </p>
        </div>

        <RefreshFeedButton />
      </div>
    );
  }

  return (
    <div className="animate-up">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient">Active Predictions</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Predict outcomes to climb the global leaderboard.
        </p>
      </header>

      <div className="prediction-grid">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            existingPrediction={predictionsMap[match.id]}
            currentUser={username}
          />
        ))}
      </div>
    </div>
  );
}