import { inject, Injectable } from '@angular/core';
import { Credentials, Session } from '../../domain/models/session.model';
import { AuthRepositoryPort, SessionStoragePort } from '../ports/auth-repository.port';

@Injectable({ providedIn: 'root' })
export class LoginUseCase {
  private readonly auth = inject(AuthRepositoryPort);
  private readonly storage = inject(SessionStoragePort);

  async execute(credentials: Credentials): Promise<Session> {
    const session = await this.auth.login(credentials);
    this.storage.write(session);
    return session;
  }
}
