export type Role = 'admin' | 'seller';

export interface Session {
  readonly accessToken: string;
  readonly expiresAt: Date;
  readonly username: string;
  readonly role: Role;
}

export interface Credentials {
  readonly username: string;
  readonly password: string;
}
