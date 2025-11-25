import { User } from './User';

export interface AuthRepository {
    signIn(email: string, password: string): Promise<User>;
    signUp(email: string, password: string, name: string): Promise<User>;
    signInWithGoogle(): Promise<User>;
    signOut(): Promise<void>;
    sendEmailVerification(user: User): Promise<void>;
    observeAuthState(callback: (user: User | null) => void): () => void;
    getCurrentUser(): Promise<User | null>;
    // Password management methods
    linkPassword(password: string): Promise<void>;
    updatePassword(currentPassword: string, newPassword: string): Promise<void>;
    hasPasswordLinked(): Promise<boolean>;
}
