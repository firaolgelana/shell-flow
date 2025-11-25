import { AuthRepository } from '../domain/AuthRepository';
import { User } from '../domain/User';

export class SignInWithGoogleUseCase {
    constructor(private authRepository: AuthRepository) { }

    async execute(): Promise<User> {
        const user = await this.authRepository.signInWithGoogle();
        // if (!user.emailVerified) {
        //     await this.authRepository.signOut();
        //     throw new Error("Please verify your email address before signing in.");
        // }
        return user;
    }
}
