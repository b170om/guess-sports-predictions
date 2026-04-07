import { cache } from 'react';
import { createClient } from '@/utils/supabase/server';

export const getCurrentProfile = cache(async () => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { user: null, profile: null };
    }

    const fallbackProfile = {
        user_id: user.id,
        username: user.user_metadata?.username ?? null,
        email: user.email ?? null,
        role: user.user_metadata?.role ?? null,
        profile_image: null,
    };

    const needsProfileLookup =
        !fallbackProfile.username || !fallbackProfile.email || !fallbackProfile.role;

    if (!needsProfileLookup) {
        return { user, profile: fallbackProfile };
    }

    const { data: profile, error } = await supabase
        .from('users')
        .select('user_id, username, email, role, profile_image')
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error loading current profile:', error.message);
    }

    return {
        user,
        profile: {
            user_id: user.id,
            username: profile?.username ?? fallbackProfile.username,
            email: profile?.email ?? fallbackProfile.email,
            role: profile?.role ?? fallbackProfile.role,
            profile_image: profile?.profile_image ?? null,
        },
    };
});