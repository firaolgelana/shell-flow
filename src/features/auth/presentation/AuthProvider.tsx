'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '../domain/User';
import { ObserveAuthStateUseCase } from '../application/ObserveAuthStateUseCase';
import { authRepository } from '../infrastructure/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
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

    useEffect(() => {
        if (!loading) {
            if (user && (pathname === '/sign-in' || pathname === '/sign-up')) {
                router.push('/profile');
            }
            // Optional: Protect private routes
            // if (!user && pathname.startsWith('/profile')) {
            //   router.push('/login');
            // }
        }
    }, [user, loading, pathname, router]);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
