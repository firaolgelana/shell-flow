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
    sendEmailVerification,
    EmailAuthProvider,
    linkWithCredential,
    updatePassword,
    reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/firebaseConfig';
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
            emailVerified: firebaseUser.emailVerified,
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

    private async saveUserToFirestore(user: User): Promise<void> {
        // Skip Firestore write when the browser is offline (prevents "client is offline" errors)
        if (typeof window !== 'undefined' && !navigator.onLine) {
            console.warn('Offline: skipping saveUserToFirestore');
            return;
        }
        try {
            const userRef = doc(db, 'users', user.id);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    uid: user.id,
                    email: user.email,
                    displayName: user.displayName ?? null,
                    photoURL: user.photoURL ?? null,
                    createdAt: new Date().toISOString(),
                });
            }
        } catch (error) {
            // Firestore throws an "unavailable"/"offline" error when the client is disconnected.
            // We treat it as a non‑fatal warning because the user can still sign up.
            const err: any = error;
            if (err?.code === 'unavailable' || err?.code === 'offline') {
                console.warn('Firestore offline – will retry later');
                return;
            }
            console.error('Error saving user to Firestore:', error);
            // We don't re‑throw to avoid blocking auth if Firestore fails.
        }
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
            const user = this.mapFirebaseUserToUser(auth.currentUser || userCredential.user);
            await this.saveUserToFirestore(user);
            return user;
        } catch (error) {
            this.handleError(error);
        }
    }

    async signInWithGoogle(): Promise<User> {
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = this.mapFirebaseUserToUser(userCredential.user);
            await this.saveUserToFirestore(user);
            return user;
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

    async sendEmailVerification(user: User): Promise<void> {
        // If the client is offline, the Firebase SDK cannot contact the server.
        if (typeof window !== 'undefined' && !navigator.onLine) {
            console.warn('Offline: cannot send email verification now');
            return;
        }
        try {
            if (auth.currentUser) {
                console.log('Attempting to send verification email to:', auth.currentUser.email);
                await sendEmailVerification(auth.currentUser);
                console.log('Verification email sent successfully');
            } else {
                console.error('No current user found when trying to send verification email');
            }
        } catch (error) {
            // Handle the specific "too‑many‑requests" error separately for a nicer UI later.
            const err: any = error;
            console.error('Error sending verification email:', err);
            if (err?.code === 'auth/too-many-requests') {
                console.warn('Too many verification emails sent – please wait before retrying');
                return;
            }
            this.handleError(error);
        }
    }

    observeAuthState(callback: (user: User | null) => void): () => void {
        return onAuthStateChanged(auth, (firebaseUser) => {
            const user = firebaseUser ? this.mapFirebaseUserToUser(firebaseUser) : null;
            callback(user);
        });
    }

    async getCurrentUser(): Promise<User | null> {
        await auth.authStateReady();
        return auth.currentUser ? this.mapFirebaseUserToUser(auth.currentUser) : null;
    }

    async linkPassword(password: string): Promise<void> {
        try {
            if (!auth.currentUser) {
                throw new AuthError('No authenticated user found');
            }

            // Check if user already has password linked
            const hasPassword = await this.hasPasswordLinked();
            if (hasPassword) {
                throw new AuthError('Password is already linked to this account');
            }

            // Create email credential
            const credential = EmailAuthProvider.credential(
                auth.currentUser.email!,
                password
            );

            // Link credential to current user
            await linkWithCredential(auth.currentUser, credential);
        } catch (error) {
            this.handleError(error);
        }
    }

    async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
        try {
            if (!auth.currentUser || !auth.currentUser.email) {
                throw new AuthError('No authenticated user found');
            }

            // Reauthenticate user with current password
            const credential = EmailAuthProvider.credential(
                auth.currentUser.email,
                currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Update to new password
            await updatePassword(auth.currentUser, newPassword);
        } catch (error) {
            this.handleError(error);
        }
    }

    async hasPasswordLinked(): Promise<boolean> {
        try {
            if (!auth.currentUser) {
                return false;
            }

            // Check if user has email/password provider
            const providers = auth.currentUser.providerData.map(p => p.providerId);
            return providers.includes('password');
        } catch (error) {
            console.error('Error checking password link status:', error);
            return false;
        }
    }
}
