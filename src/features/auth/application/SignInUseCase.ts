import { AuthRepository } from '../domain/AuthRepository';
import { User } from '../domain/User';

export class SignInUseCase {
    constructor(private authRepository: AuthRepository) { }

    async execute(email: string, password: string): Promise<User> {
        const user = await this.authRepository.signIn(email, password);
        // if (!user.emailVerified) {
        //     await this.authRepository.signOut();
        //     throw new Error("Please verify your email address before signing in.");
        // }
        return user;
    }
}
