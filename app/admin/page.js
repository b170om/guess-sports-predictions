import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import CreateMatchForm from './CreateMatchForm';
import ImportChampionsLeaguePanel from './ImportChampionsLeaguePanel';
import SyncChampionsLeagueResultsPanel from './SyncChampionsLeagueResultsPanel';
import AdminMatchCard from './AdminMatchCard';

function StatCard({ label, value, accent }) {
  return (
    <div
      className="stitch-card"
      style={{
        padding: '1rem',
        textAlign: 'center',
        background: 'var(--surface-high)',
      }}
    >
      <span
        style={{
          fontSize: '0.6rem',
          fontWeight: 800,
          color: 'var(--text-muted)',
          display: 'block',
          marginBottom: '0.25rem',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '1.75rem',
          fontWeight: 900,
          color: accent || 'var(--text-primary)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/');
  }

  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const { count: predictionsCount } = await supabase
    .from('predictions')
    .select('*', { count: 'exact', head: true });

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_datetime', { ascending: true });

  const allMatches = matches || [];
  const draftMatches = allMatches.filter((match) => !match.is_published);
  const publishedMatches = allMatches.filter((match) => match.is_published);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Manage matches, imports, publishing, and final results.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
          }}
        >
          <StatCard label="USERS" value={usersCount ?? 0} />
          <StatCard label="PREDICTIONS" value={predictionsCount ?? 0} />
          <StatCard label="DRAFT MATCHES" value={draftMatches.length} accent="var(--accent-violet)" />
          <StatCard label="PUBLISHED MATCHES" value={publishedMatches.length} accent="var(--accent-blue)" />
        </div>
      </header>

      <div>
        <style>{`
          @media (min-width: 1024px) {
            .admin-grid {
              grid-template-columns: 420px 1fr !important;
            }
          }
        `}</style>

        <div
          className="admin-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
              Admin Tools
            </h2>

            <CreateMatchForm />
            <ImportChampionsLeaguePanel />
            <SyncChampionsLeagueResultsPanel />
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Draft Matches
              </h2>

              {draftMatches.length === 0 ? (
                <div
                  className="stitch-card"
                  style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  No draft matches right now.
                </div>
              ) : (
                draftMatches.map((match) => (
                  <AdminMatchCard key={match.id} match={match} />
                ))
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Published Matches
              </h2>

              {publishedMatches.length === 0 ? (
                <div
                  className="stitch-card"
                  style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  No published matches right now.
                </div>
              ) : (
                publishedMatches.map((match) => (
                  <AdminMatchCard key={match.id} match={match} />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}