'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { logout } from '../login/actions';
import { createClient } from '@/utils/supabase/client';

export default function NavBar({ user }) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [role, setRole] = useState(user?.user_metadata?.role ?? null);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (!user?.id || role) return;

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!cancelled && !error) {
        setRole(data?.role ?? null);
      }
    }

    loadRole();

    return () => {
      cancelled = true;
    };
  }, [supabase, user?.id, role]);

  const navLinks = [];

  if (user) {
    navLinks.push({ href: '/', label: 'Live', icon: 'sports_soccer' });
    navLinks.push({ href: '/past-results', label: 'History', icon: 'query_stats' });
    navLinks.push({ href: '/leaderboard', label: 'Ranks', icon: 'emoji_events' });

    if (role === 'admin') {
      navLinks.push({ href: '/admin', label: 'Admin', icon: 'admin_panel_settings' });
    }
  }

  const isLinkActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  function DesktopNavItem({ href, label, icon }) {
    const active = isLinkActive(href);

    return (
      <Link
        href={href}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.9rem',
          padding: '0.95rem 1rem',
          borderRadius: '18px',
          color: active ? 'var(--primary)' : 'var(--text-secondary)',
          background: active ? 'rgba(173, 198, 255, 0.10)' : 'transparent',
          border: active ? '1px solid rgba(173, 198, 255, 0.14)' : '1px solid transparent',
          transition: 'all 0.18s ease',
          fontWeight: active ? 700 : 600,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: '1.2rem',
            fontVariationSettings: active ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 500",
          }}
        >
          {icon}
        </span>

        <span style={{ fontSize: '0.95rem' }}>{label}</span>
      </Link>
    );
  }

  function MobileNavItem({ href, label, icon }) {
    const active = isLinkActive(href);

    return (
      <Link
        href={href}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          justifyContent: 'center',
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            minWidth: '68px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.22rem',
            padding: '0.55rem 0.25rem',
            borderRadius: '18px',
            background: active ? 'rgba(173, 198, 255, 0.10)' : 'transparent',
            border: active ? '1px solid rgba(173, 198, 255, 0.14)' : '1px solid transparent',
            color: active ? 'var(--primary)' : 'var(--text-secondary)',
            transition: 'all 0.18s ease',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '1.2rem',
              fontVariationSettings: active ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 500",
            }}
          >
            {icon}
          </span>

          <span
            style={{
              fontSize: '0.62rem',
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-display)',
            }}
          >
            {label}
          </span>
        </div>
      </Link>
    );
  }

  if (!user) {
    return (
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 120,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem 1.2rem',
          background: 'rgba(11, 19, 38, 0.72)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(140, 144, 159, 0.10)',
        }}
      >
        <Link
          href="/"
          className="text-gradient"
          style={{
            fontSize: '1.55rem',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            fontStyle: 'italic',
            fontFamily: 'var(--font-display)',
          }}
        >
          GUESS
        </Link>

        <Link
          href="/login"
          className="stitch-button primary"
          style={{
            width: 'auto',
            minHeight: '42px',
            padding: '0.7rem 1rem',
            borderRadius: '16px',
          }}
        >
          Sign In
        </Link>
      </header>
    );
  }

  return (
    <>
      <aside
        className="hidden-mobile"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 'var(--sidebar-width)',
          height: '100dvh',
          padding: '1.35rem',
          background: 'rgba(19, 27, 46, 0.94)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(140, 144, 159, 0.10)',
          flexDirection: 'column',
          zIndex: 40,
        }}
      >
        <div style={{ marginBottom: '2rem', padding: '0.4rem 0.4rem 0 0.4rem' }}>
          <Link href="/" style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span
              className="text-gradient"
              style={{
                fontSize: '1.65rem',
                fontWeight: 900,
                fontStyle: 'italic',
                letterSpacing: '-0.05em',
                fontFamily: 'var(--font-display)',
              }}
            >
              GUESS
            </span>
            <span
              style={{
                fontSize: '0.64rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 800,
              }}
            >
              Sports Predictions
            </span>
          </Link>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          {navLinks.map((link) => (
            <DesktopNavItem key={link.href} {...link} />
          ))}
        </nav>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(140, 144, 159, 0.10)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          <Link
            href="/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem',
              padding: '0.95rem 1rem',
              borderRadius: '18px',
              color: isLinkActive('/profile') ? 'var(--primary)' : 'var(--text-secondary)',
              background: isLinkActive('/profile') ? 'rgba(173, 198, 255, 0.10)' : 'transparent',
              border: isLinkActive('/profile')
                ? '1px solid rgba(173, 198, 255, 0.14)'
                : '1px solid transparent',
              fontWeight: isLinkActive('/profile') ? 700 : 600,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: isLinkActive('/profile')
                  ? "'FILL' 1, 'wght' 600"
                  : "'FILL' 0, 'wght' 500",
              }}
            >
              person
            </span>
            <span>Profile</span>
          </Link>

          <form action={logout}>
            <button
              type="submit"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem',
                padding: '0.95rem 1rem',
                borderRadius: '18px',
                color: 'var(--text-secondary)',
                transition: 'all 0.18s ease',
              }}
            >
              <span className="material-symbols-outlined">logout</span>
              <span style={{ fontWeight: 600 }}>Log out</span>
            </button>
          </form>
        </div>
      </aside>

      <header
        className="hidden-desktop"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 'calc(68px + env(safe-area-inset-top))',
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(11, 19, 38, 0.72)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(140, 144, 159, 0.10)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href="/"
            className="text-gradient"
            style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: '-0.05em',
              fontFamily: 'var(--font-display)',
            }}
          >
            GUESS
          </Link>
        </div>

        <Link
          href="/profile"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '999px',
            background: 'rgba(45, 52, 73, 0.85)',
            border: '1px solid rgba(140, 144, 159, 0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            fontWeight: 800,
            fontSize: '0.82rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          }}
        >
          {(user.user_metadata?.username?.[0] || 'U').toUpperCase()}
        </Link>
      </header>

      <nav
        className="hidden-desktop"
        style={{
          position: 'fixed',
          left: '12px',
          right: '12px',
          bottom: 'calc(12px + env(safe-area-inset-bottom))',
          zIndex: 110,
          borderRadius: '28px',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          background: 'rgba(19, 27, 46, 0.84)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(140, 144, 159, 0.12)',
          boxShadow: '0 18px 42px rgba(0, 0, 0, 0.28)',
        }}
      >
        {navLinks.map((link) => (
          <MobileNavItem key={link.href} {...link} />
        ))}
      </nav>
    </>
  );
}