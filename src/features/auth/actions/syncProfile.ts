'use server';

import { createClient } from '@/utils/supabase/server';

export async function syncProfileAction(user: {
    id: string;
    email: string;
    displayName?: string;
    photoURL?: string;
}) {
    const supabase = await createClient();

    try {
        // 1. Try to fetch existing profile
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (existingProfile) {
            return { success: true, profile: existingProfile };
        }

        // 2. If not found, try to insert (Upsert)
        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                display_name: user.displayName,
                photo_url: user.photoURL,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' })
            .select()
            .single();

        if (error) {
            console.error('Server-side profile sync error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, profile: data };
    } catch (error) {
        console.error('Unexpected error in syncProfileAction:', error);
        return { success: false, error: 'Unexpected error' };
    }
}
