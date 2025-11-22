import { User } from './User';

export interface AuthRepository {
    signIn(email: string, password: string): Promise<User>;
    signUp(email: string, password: string, name: string): Promise<User>;
    signInWithGoogle(): Promise<User>;
    signOut(): Promise<void>;
    observeAuthState(callback: (user: User | null) => void): () => void;
}
