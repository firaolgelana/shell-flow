'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '../domain/User';
import { ObserveAuthStateUseCase } from '../application/ObserveAuthStateUseCase';
import { authRepository } from '../infrastructure';

import { SignOutUseCase } from '../application/SignOutUseCase';

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
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signOut = async () => {
        try {
            const signOutUseCase = new SignOutUseCase(authRepository);
            await signOutUseCase.execute();
            router.push('/sign-in');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    useEffect(() => {
        if (!loading) {
            // Redirect authenticated users away from auth pages
            if (user && (pathname === '/sign-in' || pathname === '/sign-up')) {
                router.push('/dashboard');
            }

            // Protect private routes from unauthenticated users
            if (!user && (pathname.startsWith('/profile') || pathname === '/verify-email' || pathname.startsWith('/dashboard') || pathname.startsWith('/settings'))) {
                router.push('/sign-in');
            }
        }
    }, [user, loading, pathname, router]);

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
