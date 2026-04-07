import './globals.css';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import NavBar from './components/NavBar';
import { getCurrentProfile } from '@/utils/auth/get-current-profile';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
});

export const metadata = {
  metadataBase: new URL('https://guess-sports-predictions.vercel.app'),
  title: 'GUESS | Sports Predictions',
  description: 'Predict match outcomes, earn points, and climb the leaderboard.',
  openGraph: {
    title: 'GUESS | Sports Predictions',
    description: 'Predict match outcomes, earn points, and climb the leaderboard.',
    url: '/',
    siteName: 'GUESS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GUESS | Sports Predictions',
    description: 'Predict match outcomes, earn points, and climb the leaderboard.',
  },
};

export default async function RootLayout({ children }) {
  const { user, profile } = await getCurrentProfile();

  const navUser = user
    ? {
      id: user.id,
      email: user.email ?? '',
      username: profile?.username ?? null,
      role: profile?.role ?? null,
    }
    : null;

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>

      <body className={`${inter.variable} ${jakarta.variable}`}>
        <div className={`app-layout ${navUser ? 'shell-auth' : 'shell-guest'}`}>
          <NavBar user={navUser} />

          <main className="main-content">
            <div className="page-shell">
              <div className="page-content">{children}</div>

              <footer className="site-footer">
                <div className="site-footer__brand">
                  <span className="site-footer__logo">GUESS</span>
                  <span className="site-footer__tagline">Sports Predictions</span>
                </div>

                <div className="site-footer__credit">Built by Yuval Cohen</div>
              </footer>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}