import { AuthRepository } from '../domain/AuthRepository';
import { User } from '../domain/User';

export class SignInWithGoogleUseCase {
    constructor(private authRepository: AuthRepository) { }

    async execute(): Promise<User> {
        return this.authRepository.signInWithGoogle();
    }
}
