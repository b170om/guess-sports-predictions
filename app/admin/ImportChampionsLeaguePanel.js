'use client';

import { useState, useTransition } from 'react';
import { importChampionsLeagueMatches } from './actions';

export default function ImportChampionsLeaguePanel() {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState(null);

    const handleImport = () => {
        setResult(null);

        startTransition(async () => {
            const response = await importChampionsLeagueMatches();
            setResult(response);
        });
    };

    return (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ marginBottom: '0.8rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Import Champions League
                </h2>
                <p style={{ color: 'var(--outline)', margin: 0, lineHeight: 1.6 }}>
                    Imports the next 21 days of Champions League matches from football-data.org as drafts.
                    Drafts stay hidden from users until you publish them.
                </p>
            </div>

            <button
                type="button"
                className="btn-primary"
                onClick={handleImport}
                disabled={isPending}
                style={{ padding: '0.7rem 1.2rem' }}
            >
                {isPending ? 'Importing...' : 'Import CL Matches'}
            </button>

            {result?.error && (
                <div style={{ marginTop: '1rem', color: 'var(--error)', fontSize: '0.9rem' }}>
                    {result.error}
                </div>
            )}

            {result?.success && (
                <div style={{ marginTop: '1rem', color: 'var(--success)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                    <div>{result.message}</div>
                    <div>Created: {result.createdCount ?? 0}</div>
                    <div>Updated: {result.updatedCount ?? 0}</div>
                    <div>Skipped: {result.skippedCount ?? 0}</div>
                </div>
            )}
        </div>
    );
}