'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/shared/config/supabase';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Supabase automatically handles the OAuth callback
                // Just check if we have a session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Auth callback error:', error);
                    router.push('/sign-in?error=auth_failed');
                    return;
                }

                if (session) {
                    // Successfully authenticated, redirect to dashboard
                    router.push('/dashboard');
                } else {
                    router.push('/sign-in');
                }
            } catch (error) {
                console.error('Callback handling error:', error);
                router.push('/sign-in?error=callback_failed');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Completing sign in...</p>
            </div>
        </div>
    );
}
