'use client';

import { useState, useTransition } from 'react';
import { syncChampionsLeagueResults } from './actions';

export default function SyncChampionsLeagueResultsPanel() {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState(null);

    const handleSync = () => {
        setResult(null);

        startTransition(async () => {
            const response = await syncChampionsLeagueResults();
            setResult(response);
        });
    };

    return (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ marginBottom: '0.8rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Sync Champions League Results
                </h2>
                <p style={{ color: 'var(--outline)', margin: 0, lineHeight: 1.6 }}>
                    Checks imported Champions League matches that are not finished yet, and updates final scores
                    when football-data marks them as finished.
                </p>
            </div>

            <button
                type="button"
                className="btn-primary"
                onClick={handleSync}
                disabled={isPending}
                style={{ padding: '0.7rem 1.2rem' }}
            >
                {isPending ? 'Syncing...' : 'Sync CL Results'}
            </button>

            {result?.error && (
                <div style={{ marginTop: '1rem', color: 'var(--error)', fontSize: '0.9rem' }}>
                    {result.error}
                </div>
            )}

            {result?.success && (
                <div style={{ marginTop: '1rem', color: 'var(--success)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                    <div>{result.message}</div>
                    <div>Checked: {result.checkedCount ?? 0}</div>
                    <div>Synced to finished: {result.syncedCount ?? 0}</div>
                    <div>Unchanged: {result.unchangedCount ?? 0}</div>
                </div>
            )}
        </div>
    );
}