import { AuthRepository } from '../domain/AuthRepository';
import { User } from '../domain/User';

export class SignUpUseCase {
    constructor(private authRepository: AuthRepository) { }

    async execute(email: string, password: string, name: string): Promise<User> {
        const user = await this.authRepository.signUp(email, password, name);
        // await this.authRepository.sendEmailVerification(user);
        return user;
    }
}
