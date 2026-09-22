import { provideLocationMocks } from '@angular/common/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { SessionStoragePort } from './application/ports/auth-repository.port';
import { Role, Session } from './domain/models/session.model';
import { infrastructureProviders } from './infrastructure/providers';

function sessionOf(role: Role): Session {
  return {
    accessToken: 'token',
    expiresAt: new Date(Date.now() + 3_600_000),
    username: role === 'admin' ? 'admin' : 'vendedor.demo',
    role,
  };
}

/**
 * The bounce lands on the catalogue, which asks the backend for products: the spec is about
 * where the router leaves the person, so that request is left unanswered on purpose.
 */
async function urlAfterEntering(path: string, role: Role): Promise<string> {
  const session = sessionOf(role);

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideLocationMocks(),
      provideRouter(routes),
      ...infrastructureProviders,
      {
        provide: SessionStoragePort,
        useValue: { read: () => session, write: () => {}, clear: () => {} },
      },
    ],
  });

  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(path);

  return TestBed.inject(Router).url;
}

describe('routes', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('lets an administrator reach the seller sign-up (DP-04)', async () => {
    expect(await urlAfterEntering('/vendedores/nuevo', 'admin')).toBe('/vendedores/nuevo');
  });

  it('turns a seller away from the seller sign-up (DP-04)', async () => {
    expect(await urlAfterEntering('/vendedores/nuevo', 'seller')).toBe('/productos');
  });
});
