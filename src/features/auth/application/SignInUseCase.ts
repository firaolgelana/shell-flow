import { AuthRepository } from '../domain/AuthRepository';
import { User } from '../domain/User';

export class SignInUseCase {
    constructor(private authRepository: AuthRepository) { }

    async execute(email: string, password: string): Promise<User> {
        return this.authRepository.signIn(email, password);
    }
}
