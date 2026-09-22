import { Credentials, Session } from '../../domain/models/session.model';

export abstract class AuthRepositoryPort {
  abstract login(credentials: Credentials): Promise<Session>;

  /**
   * DP-04: the role is not a parameter. An `admin` is born only from the deployment's own
   * seeding, so making it choosable here would open a second way up.
   */
  abstract registerSeller(credentials: Credentials): Promise<string>;
}

/**
 * Kept apart from the repository so that swapping localStorage for a cookie or an
 * in-memory store never reaches the use case.
 */
export abstract class SessionStoragePort {
  abstract read(): Session | null;
  abstract write(session: Session): void;
  abstract clear(): void;
}
