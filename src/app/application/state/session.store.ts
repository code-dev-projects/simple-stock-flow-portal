import { computed, inject, Injectable, signal } from '@angular/core';
import { Role, Session } from '../../domain/models/session.model';
import { SessionStoragePort } from '../ports/auth-repository.port';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly storage = inject(SessionStoragePort);
  private readonly _session = signal<Session | null>(this.storage.read());

  readonly session = this._session.asReadonly();
  readonly username = computed(() => this._session()?.username ?? null);
  readonly isAuthenticated = computed(() => {
    const session = this._session();
    return session !== null && session.expiresAt.getTime() > Date.now();
  });

  set(session: Session): void {
    this.storage.write(session);
    this._session.set(session);
  }

  clear(): void {
    this.storage.clear();
    this._session.set(null);
  }

  hasRole(role: Role): boolean {
    return this._session()?.role === role;
  }

  token(): string | null {
    return this.isAuthenticated() ? (this._session()?.accessToken ?? null) : null;
  }
}
