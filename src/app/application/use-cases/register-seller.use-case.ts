import { inject, Injectable } from '@angular/core';
import { Credentials } from '../../domain/models/session.model';
import { AuthRepositoryPort } from '../ports/auth-repository.port';

@Injectable({ providedIn: 'root' })
export class RegisterSellerUseCase {
  private readonly auth = inject(AuthRepositoryPort);

  /** Returns the id of the new seller; the portal has no operation that reads it back. */
  execute(credentials: Credentials): Promise<string> {
    return this.auth.registerSeller(credentials);
  }
}
