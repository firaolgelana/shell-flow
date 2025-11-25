import { AuthRepository } from '../../auth/domain/AuthRepository';

export class CheckPasswordLinkedUseCase {
    constructor(private authRepository: AuthRepository) { }

    async execute(): Promise<boolean> {
        return await this.authRepository.hasPasswordLinked();
    }
}
