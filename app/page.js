'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import MatchCard from './components/MatchCard';

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [matches, setMatches] = useState([]);
  const [predictionsMap, setPredictionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const loadData = useCallback(
    async (showLoader = false) => {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setCurrentUser(null);
          setMatches([]);
          setPredictionsMap({});
          return;
        }

        let username = user.user_metadata?.username ?? null;

        if (!username) {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('username')
            .eq('user_id', user.id)
            .single();

          if (profileError) throw profileError;
          username = profile?.username ?? null;
        }

        if (!username) {
          throw new Error('Could not determine current username.');
        }

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

        if (matchesError) throw matchesError;
        if (predictionsError) throw predictionsError;

        const pMap = {};
        (predictionsData || []).forEach((prediction) => {
          pMap[prediction.match_id] = prediction;
        });

        setCurrentUser(username);
        setMatches(matchesData || []);
        setPredictionsMap(pMap);
      } catch (err) {
        console.error('Error loading data:', err.message);
        setMatches([]);
        setPredictionsMap({});
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [supabase]
  );

  useEffect(() => {
    let isMounted = true;

    const safeLoad = async (showLoader = false) => {
      if (!isMounted) return;
      await loadData(showLoader);
    };

    safeLoad(true);

    const handleFocus = () => {
      safeLoad(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        safeLoad(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        ></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span
          style={{
            color: 'var(--text-secondary)',
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
        >
          SYNCING MATCHES...
        </span>
      </div>
    );
  }

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

        <button
          onClick={() => loadData(true)}
          className="stitch-button secondary"
          style={{ width: 'auto', padding: '0.75rem 2rem' }}
        >
          Refresh Feed
        </button>
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
            currentUser={currentUser}
          />
        ))}
      </div>
    </div>
  );
}