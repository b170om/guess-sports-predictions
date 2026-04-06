'use client';

import { useState } from 'react';
import { login, signup } from './actions';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    try {
      let result;
      if (isSignUp) result = await signup(formData);
      else result = await login(formData);

      if (result?.error) {
        setErrorMsg(result.error);
        setLoading(false);
      }
    } catch (err) {
      if (err.message === 'NEXT_REDIRECT') return;
      setErrorMsg('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--bg-color)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Visual background elements */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', background: 'rgba(210, 168, 255, 0.15)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 }}></div>

      <div className="stitch-panel animate-up" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', position: 'relative', zIndex: 1, background: 'rgba(13, 17, 23, 0.8)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
           <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary)', color: '#0d1117', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 0 20px var(--primary-glow)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>rocket_launch</span>
           </div>
           <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>{isSignUp ? 'Join the Game' : 'Welcome Back'}</h1>
           <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{isSignUp ? 'Create your profile to start predicting.' : 'Sign in to access your predictions dashboard.'}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>USERNAME</label>
            <input name="username" type="text" required placeholder="player123" className="stitch-input" />
          </div>

          {isSignUp && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>EMAIL ADDRESS</label>
              <input name="email" type="email" required placeholder="you@example.com" className="stitch-input" />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PASSWORD</label>
            <input name="password" type="password" required placeholder="••••••••" className="stitch-input" />
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(248, 81, 73, 0.1)', color: 'var(--error)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(248, 81, 73, 0.2)', fontSize: '0.85rem', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          <button type="submit" disabled={loading} className="stitch-button primary" style={{ marginTop: '0.5rem' }}>
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{isSignUp ? 'Already a member?' : "Don't have an account?"}</span>
          <button 
            type="button" 
            onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, marginLeft: '0.5rem', cursor: 'pointer' }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up Free'}
          </button>
        </div>

      </div>
    </div>
  );
}
