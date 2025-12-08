'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '../domain/User';
import { ObserveAuthStateUseCase } from '../application/ObserveAuthStateUseCase';
import { authRepository } from '../infrastructure';

import { signOutAction } from '../actions/signOut';
import { supabase } from '@/shared/config/supabase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const observeAuthStateUseCase = new ObserveAuthStateUseCase(authRepository);

        const unsubscribe = observeAuthStateUseCase.execute((user) => {
            console.log('AuthProvider: User update received', user ? user.id : 'null');
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signOut = async () => {
        try {
            // 1. Clear client-side session (Supabase SDK)
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out from Supabase client:', error);
        } finally {
            // 2. FORCE CLEAR LocalStorage to remove any stale tokens
            // This ensures that even if the server request fails (e.g. 429), 
            // the browser is clean for the next user.
            if (typeof window !== 'undefined') {
                Object.keys(window.localStorage).forEach((key) => {
                    if (key.startsWith('sb-')) {
                        window.localStorage.removeItem(key);
                    }
                });
            }

            // 3. Clear server-side session
            try {
                await signOutAction();
            } catch (error) {
                console.error('Error signing out from server action:', error);
            }
        }
    };

    useEffect(() => {
        let redirectTimer: NodeJS.Timeout;

        if (!loading) {
            // Redirect authenticated users away from auth pages
            if (user && (pathname === '/sign-in' || pathname === '/sign-up')) {
                router.push('/dashboard');
            }

            // Protect private routes from unauthenticated users
            // Debounce the redirect to prevent flickering triggers
            if (!user && (pathname.startsWith('/profile') || pathname === '/verify-email' || pathname.startsWith('/dashboard') || pathname.startsWith('/settings') || pathname.startsWith('/chat'))) {
                redirectTimer = setTimeout(() => {
                    // Double check if user is still null after the delay
                    if (!user) {
                        console.log('AuthProvider: Redirecting to sign-in after debounce');
                        router.push('/sign-in');
                    }
                }, 1000); // 1 second delay to allow for session recovery
            }
        }

        return () => {
            if (redirectTimer) clearTimeout(redirectTimer);
        };
    }, [user, loading, pathname, router]);

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
