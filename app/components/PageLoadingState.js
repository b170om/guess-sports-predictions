export default function PageLoadingState({
    title = 'Loading',
    subtitle = 'Preparing your dashboard...',
}) {
    return (
        <div
            style={{
                minHeight: '50vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1rem',
            }}
        >
            <div
                className="glass-panel"
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        width: '42px',
                        height: '42px',
                        border: '3px solid var(--border)',
                        borderTopColor: 'var(--primary)',
                        borderRadius: '50%',
                        animation: 'spin 0.9s linear infinite',
                    }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

                <div
                    style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase',
                    }}
                >
                    {title}
                </div>

                <div
                    style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-muted)',
                    }}
                >
                    {subtitle}
                </div>
            </div>
        </div>
    );
}