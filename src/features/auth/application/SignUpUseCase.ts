import { AuthRepository } from '../domain/AuthRepository';
import { User } from '../domain/User';

export class SignUpUseCase {
    constructor(private authRepository: AuthRepository) { }

    async execute(email: string, password: string, name: string): Promise<User> {
        return this.authRepository.signUp(email, password, name);
    }
}
