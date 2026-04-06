import { updateSession } from '@/utils/supabase/middleware'

export default async function proxy(request) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/leaderboard/:path*',
    '/past-results/:path*',
    '/profile/:path*',
    '/admin/:path*',
  ],
}