import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser,
    AuthError as FirebaseAuthError,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile,
} from 'firebase/auth';
import { auth } from './firebase/firebaseConfig';
import { AuthRepository } from '../domain/AuthRepository';
import { User } from '../domain/User';
import {
    InvalidCredentialsError,
    UserNotFoundError,
    EmailAlreadyInUseError,
    AuthError,
} from '../domain/AuthErrors';

export class FirebaseAuthRepository implements AuthRepository {
    private mapFirebaseUserToUser(firebaseUser: FirebaseUser): User {
        return {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || undefined,
            photoURL: firebaseUser.photoURL || undefined,
        };
    }

    private handleError(error: unknown): never {
        if (error instanceof Error && 'code' in error) {
            const firebaseError = error as FirebaseAuthError;
            switch (firebaseError.code) {
                case 'auth/invalid-credential':
                case 'auth/wrong-password':
                    throw new InvalidCredentialsError();
                case 'auth/user-not-found':
                    throw new UserNotFoundError();
                case 'auth/email-already-in-use':
                    throw new EmailAlreadyInUseError();
                default:
                    throw new AuthError(firebaseError.message, firebaseError.code);
            }
        }
        throw new AuthError('An unexpected error occurred');
    }

    async signIn(email: string, password: string): Promise<User> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return this.mapFirebaseUserToUser(userCredential.user);
        } catch (error) {
            this.handleError(error);
        }
    }

    async signUp(email: string, password: string, name: string): Promise<User> {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            // Reload user to get updated profile
            await userCredential.user.reload();
            return this.mapFirebaseUserToUser(auth.currentUser || userCredential.user);
        } catch (error) {
            this.handleError(error);
        }
    }

    async signInWithGoogle(): Promise<User> {
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            return this.mapFirebaseUserToUser(userCredential.user);
        } catch (error) {
            this.handleError(error);
        }
    }

    async signOut(): Promise<void> {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            this.handleError(error);
        }
    }

    observeAuthState(callback: (user: User | null) => void): () => void {
        return onAuthStateChanged(auth, (firebaseUser) => {
            const user = firebaseUser ? this.mapFirebaseUserToUser(firebaseUser) : null;
            callback(user);
        });
    }
}
