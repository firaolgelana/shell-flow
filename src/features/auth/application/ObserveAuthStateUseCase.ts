import { AuthRepository } from '../domain/AuthRepository';
import { User } from '../domain/User';

export class ObserveAuthStateUseCase {
    constructor(private authRepository: AuthRepository) { }

    execute(callback: (user: User | null) => void): () => void {
        return this.authRepository.observeAuthState(callback);
    }
}
