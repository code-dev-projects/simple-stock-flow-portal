import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '../../../../../environments/environment';
import { routes } from '../../../../app.routes';
import { SessionStoragePort } from '../../../../application/ports/auth-repository.port';
import { ProjectPageNavigatorPort } from '../../../../application/ports/project-page-navigator.port';
import { Role, Session } from '../../../../domain/models/session.model';
import { infrastructureProviders } from '../../../../infrastructure/providers';

const PROJECT_PAGE_ROUTE = '/pagina-del-proyecto';

const configuredProjectPageUrl = environment.projectPageUrl;

/**
 * An address no source file carries. Asserting against environment.projectPageUrl would pass
 * just as well if the page held its own copy of the real address.
 */
const standInProjectPageUrl = 'https://stand-in.example/project-page/';

class NavigatorSpy extends ProjectPageNavigatorPort {
  replacedWith: string | null = null;
  pathWhenReplaced: string | null = null;

  constructor(private readonly currentPath: () => string) {
    super();
  }

  override replaceCurrentPage(url: string): void {
    this.replacedWith = url;
    this.pathWhenReplaced = this.currentPath();
  }
}

function sessionOf(role: Role): Session {
  return {
    accessToken: 'token',
    expiresAt: new Date(Date.now() + 3_600_000),
    username: role === 'admin' ? 'admin' : 'vendedor.demo',
    role,
  };
}

function setUp(session: Session | null): NavigatorSpy {
  const navigator = new NavigatorSpy(() => TestBed.inject(Location).path());

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
      { provide: ProjectPageNavigatorPort, useValue: navigator },
    ],
  });

  return navigator;
}

describe('project page redirect', () => {
  afterEach(() => {
    environment.projectPageUrl = configuredProjectPageUrl;
    TestBed.resetTestingModule();
  });

  it('hands the address that configuration carries to the navigator', async () => {
    environment.projectPageUrl = standInProjectPageUrl;
    const navigator = setUp(sessionOf('seller'));

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(PROJECT_PAGE_ROUTE);

    expect(navigator.replacedWith).toBe(standInProjectPageUrl);
  });

  it('leaves the route open to a visitor with no session', async () => {
    const navigator = setUp(null);

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(PROJECT_PAGE_ROUTE);

    expect(navigator.replacedWith).toBe(environment.projectPageUrl);
    expect(TestBed.inject(Router).url).not.toContain('/login');
  });

  /**
   * The external page can be down or the visitor offline, and the browser then sits on this
   * document for as long as the request takes: cancelling the navigation would leave them
   * staring at an empty portal with nothing to click.
   */
  it('paints a way out instead of a blank screen while the browser leaves', async () => {
    environment.projectPageUrl = standInProjectPageUrl;
    setUp(null);

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(PROJECT_PAGE_ROUTE);
    const rendered: HTMLElement = harness.fixture.nativeElement;

    expect(rendered.textContent).toContain('página del proyecto');
    expect(rendered.querySelector('a.leaving__link')?.getAttribute('href')).toBe(
      standInProjectPageUrl,
    );
    expect(rendered.querySelector('a.leaving__back')?.getAttribute('href')).toBe('/');
  });

  /**
   * The port replaces an entry rather than pushing one, so which entry is current when it runs
   * decides what "back" reaches: its own, and not the page the visitor came from.
   */
  it('spends a history entry of its own, not the one of the page it came from', async () => {
    const navigator = setUp(sessionOf('seller'));

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login');
    await harness.navigateByUrl(PROJECT_PAGE_ROUTE);

    expect(navigator.pathWhenReplaced).toBe(PROJECT_PAGE_ROUTE);
  });
});
