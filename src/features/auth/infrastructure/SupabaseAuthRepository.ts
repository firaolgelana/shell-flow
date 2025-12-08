
import { AuthRepository } from '../domain/AuthRepository';
import { User } from '../domain/User';
import { supabase } from '@/shared/config/supabase';
import { AuthError, InvalidCredentialsError, UserNotFoundError, EmailAlreadyInUseError } from '../domain/AuthErrors';

export class SupabaseAuthRepository implements AuthRepository {
    private mapSupabaseUserToUser(supabaseUser: any): User {
        return {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            displayName: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.displayName || undefined,
            photoURL: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.photoURL || undefined,
            emailVerified: !!supabaseUser.email_confirmed_at,
        };
    }

    private handleError(error: any): never {
        console.error('Supabase Auth Error:', error);
        if (error.message === 'Invalid login credentials') {
            throw new InvalidCredentialsError();
        }
        if (error.message.includes('User not found')) {
            throw new UserNotFoundError();
        }
        if (error.message.includes('already registered')) {
            throw new EmailAlreadyInUseError();
        }
        throw new AuthError(error.message || 'An unexpected error occurred');
    }

    private async saveUserToDatabase(user: User): Promise<void> {
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    display_name: user.displayName,
                    photo_url: user.photoURL,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

            if (error) {
                console.error('Supabase upsert error details:', JSON.stringify(error, null, 2));
                // Do not throw, just log. We want to proceed to fetching if possible.
                // throw error; 
            } else {
                console.log('User saved to database successfully');
            }
        } catch (error) {
            console.error('Error saving user to database:', error);
            // console.log('User object that failed to save:', user);
        }
    }

    private currentUser: User | null = null;
    private profileSynced = false;

    async signIn(email: string, password: string): Promise<User> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            if (!data.user) throw new Error('No user returned');

            return this.mapSupabaseUserToUser(data.user);
        } catch (error) {
            this.handleError(error);
        }
    }

    async signUp(email: string, password: string, name: string): Promise<User> {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        displayName: name,
                        full_name: name,
                    },
                },
            });

            if (error) throw error;
            if (!data.user) throw new Error('No user returned');

            const user = this.mapSupabaseUserToUser(data.user);
            await this.saveUserToDatabase(user);
            return user;
        } catch (error) {
            this.handleError(error);
        }
    }

    async signInWithGoogle(): Promise<User> {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
            // Note: This will redirect, so it might not return immediately.
            // The actual user mapping happens after callback.
            // For now, we return a dummy or handle the redirect flow.
            // Supabase OAuth redirects, so this promise might not resolve with a user immediately in the same context.
            // However, the interface expects a User.
            // In a SPA, we usually wait for the redirect.

            return {} as User; // Placeholder, as the page will redirect.
        } catch (error) {
            this.handleError(error);
        }
    }

    async signOut(): Promise<void> {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            this.handleError(error);
        }
    }

    async sendEmailVerification(user: User): Promise<void> {
        // Supabase sends verification email automatically on signup if enabled.
        // To resend:
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
            });
            if (error) throw error;
        } catch (error) {
            this.handleError(error);
        }
    }

    observeAuthState(callback: (user: User | null) => void): () => void {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change event:', event);

            // Ignore TOKEN_REFRESHED to prevent infinite loops of UI updates -> data fetch -> token refresh
            if (event === 'TOKEN_REFRESHED') {
                return;
            }

            if (session?.user) {
                // Map session user to domain user
                const newUser: User = {
                    id: session.user.id,
                    email: session.user.email!,
                    emailVerified: !!session.user.email_confirmed_at,
                    displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.display_name,
                    photoURL: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
                    username: session.user.user_metadata?.username,
                };

                // Prevent unnecessary updates if user data hasn't changed
                if (JSON.stringify(newUser) !== JSON.stringify(this.currentUser)) {
                    console.log('User data changed. Diff:', {
                        old: this.currentUser,
                        new: newUser
                    });
                    this.currentUser = newUser;
                    callback(newUser);
                } else {
                    console.log('User data unchanged, skipping callback');
                }

                // Background: Ensure user exists in profiles table and fetch extra data
                // Only sync on SIGNED_IN or INITIAL_SESSION to avoid loops on token refresh
                // AND only if we haven't synced yet for this session
                if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && !this.profileSynced) {
                    this.profileSynced = true;
                    this.syncUserProfile(newUser, (updatedUser) => {
                        if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(this.currentUser)) {
                            this.currentUser = updatedUser;
                            callback(updatedUser);
                        }
                    });
                }
            } else {
                if (this.currentUser !== null) {
                    this.currentUser = null;
                    this.profileSynced = false; // Reset sync flag on sign out
                    callback(null);
                }
            }
        });

        return () => subscription.unsubscribe();
    }

    private async syncUserProfile(user: User, callback: (user: User | null) => void) {
        try {
            console.log('Starting profile sync for:', user.id);

            // Use Server Action for reliable profile syncing
            const { syncProfileAction } = await import('../actions/syncProfile');
            const result = await syncProfileAction({
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            });

            if (!result.success) {
                console.error('Profile sync failed on server:', result.error);
                return;
            }

            const userData = result.profile;

            if (userData) {
                console.log('Profile data fetched from server:', userData);
                // Map DB fields to User fields if necessary
                const updatedUser = {
                    ...user,
                    username: userData.username,
                    bio: userData.bio
                };
                callback(updatedUser);
            }
        } catch (error) {
            console.error('Profile sync failed:', error);
        }
    }

    async getCurrentUser(): Promise<User | null> {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (!supabaseUser) return null;

        let user = this.mapSupabaseUserToUser(supabaseUser);
        const { data: userData } = await supabase
            .from('profiles')
            .select('username, bio')
            .eq('id', user.id)
            .single();

        if (userData) {
            user = { ...user, ...userData };
        }
        return user;
    }

    async linkPassword(password: string): Promise<void> {
        // Supabase doesn't support linking password to an existing OAuth account easily via client SDK in the same way.
        // It usually handles multiple identities automatically if emails match.
        // For now, we'll leave this unimplemented or throw not supported.
        console.warn('linkPassword not fully supported in Supabase client migration yet');
    }

    async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
        } catch (error) {
            this.handleError(error);
        }
    }

    async hasPasswordLinked(): Promise<boolean> {
        // Difficult to check specifically for password provider in Supabase client without admin.
        // We can check identities.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.identities) return false;
        return user.identities.some(id => id.provider === 'email');
    }
}
