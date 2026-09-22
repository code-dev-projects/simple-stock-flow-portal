import { Injectable } from '@angular/core';
import { Session } from '../../domain/models/session.model';
import { SessionStoragePort } from '../../application/ports/auth-repository.port';

const STORAGE_KEY = 'simple-stock-flow.session';

@Injectable()
export class LocalSessionStorage extends SessionStoragePort {
  read(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Session & { expiresAt: string };
      return { ...parsed, expiresAt: new Date(parsed.expiresAt) };
    } catch {
      // Private mode, blocked storage or corrupt JSON: treated as no session at all.
      return null;
    }
  }

  write(session: Session): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Without persistence the session lives in memory; no reason to break login over it.
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to recover from: the session is gone either way.
    }
  }
}
