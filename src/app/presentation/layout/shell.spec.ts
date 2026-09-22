import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionStoragePort } from '../../application/ports/auth-repository.port';
import { Role, Session } from '../../domain/models/session.model';
import { environment } from '../../../environments/environment';
import { Shell } from './shell';

const configuredProjectPageUrl = environment.projectPageUrl;

/**
 * An address no source file carries. Asserting against environment.projectPageUrl would pass
 * just as well if the component held its own copy of the real address.
 */
const standInProjectPageUrl = 'https://stand-in.example/project-page/';

function sessionOf(role: Role): Session {
  return {
    accessToken: 'token',
    expiresAt: new Date(Date.now() + 3_600_000),
    username: role === 'admin' ? 'admin' : 'vendedor.demo',
    role,
  };
}

async function shellFor(role: Role): Promise<ComponentFixture<Shell>> {
  const session = sessionOf(role);

  await TestBed.configureTestingModule({
    imports: [Shell],
    providers: [
      provideRouter([]),
      {
        provide: SessionStoragePort,
        useValue: { read: () => session, write: () => {}, clear: () => {} },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(Shell);
  fixture.detectChanges();
  return fixture;
}

function projectPageLink(fixture: ComponentFixture<Shell>): HTMLAnchorElement | null {
  return fixture.nativeElement.querySelector('a.app-nav__link--external');
}

/** Picked by address: the portal serves the page itself, so the address is the contract. */
function apiDocsLink(fixture: ComponentFixture<Shell>): HTMLAnchorElement | null {
  return fixture.nativeElement.querySelector('a[href="/swagger"]');
}

/** What a sighted visitor reads: the screen-reader-only notice is not part of it. */
function visibleText(element: Element | null): string {
  if (element === null) return '';

  const copy = element.cloneNode(true) as Element;
  copy.querySelectorAll('.visually-hidden').forEach((hidden) => hidden.remove());
  return (copy.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('Shell', () => {
  afterEach(() => {
    environment.projectPageUrl = configuredProjectPageUrl;
    TestBed.resetTestingModule();
  });

  it('offers the seller sign-up to an administrator (DP-04)', async () => {
    const fixture = await shellFor('admin');

    const link: HTMLAnchorElement | null = fixture.nativeElement.querySelector(
      '.app-nav a[href="/vendedores/nuevo"]',
    );

    expect(link).withContext('the administrator has no way into the seller sign-up').not.toBeNull();
    expect(link?.textContent?.trim()).toBe('Nuevo vendedor');
  });

  it('hides the seller sign-up from a seller (DP-04)', async () => {
    const fixture = await shellFor('seller');

    expect(fixture.nativeElement.querySelector('a[href="/vendedores/nuevo"]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Nuevo vendedor');
  });

  it('labels the project page link with text on screen', async () => {
    const fixture = await shellFor('seller');

    const link = projectPageLink(fixture);

    expect(link).withContext('the portal has no way out to the project page').not.toBeNull();
    expect(visibleText(link))
      .withContext('the link renders with nothing a sighted visitor can read')
      .toContain('Página del proyecto');
  });

  it('takes the project page address from configuration, not from a copy of its own', async () => {
    environment.projectPageUrl = standInProjectPageUrl;

    const fixture = await shellFor('seller');

    expect(projectPageLink(fixture)?.getAttribute('href')).toBe(standInProjectPageUrl);
  });

  it('opens the project page in another tab without handing it the opener window', async () => {
    const fixture = await shellFor('admin');

    const link = projectPageLink(fixture);

    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('announces the new tab to assistive technology only', async () => {
    const fixture = await shellFor('admin');

    const link = projectPageLink(fixture);

    expect(link?.querySelector('.visually-hidden')?.textContent)
      .withContext('a screen reader gets no warning that the link leaves the portal')
      .toContain('pestaña nueva');
    expect(visibleText(link))
      .withContext('the notice takes room in a header that has none to give')
      .not.toContain('pestaña');
  });

  it('leads to the API documentation the portal already serves, whatever the role', async () => {
    const fixture = await shellFor('seller');

    const link = apiDocsLink(fixture);

    expect(link)
      .withContext('signed in, there is no way to reach the documentation of the API')
      .not.toBeNull();
    expect(visibleText(link)).toContain('Documentación de la API');
  });

  it('opens the API documentation in another tab, keeping the cart alive', async () => {
    const fixture = await shellFor('admin');

    const link = apiDocsLink(fixture);

    // The cart lives in memory: leaving the single page application would empty it mid-sale.
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('announces the API documentation tab to assistive technology only', async () => {
    const fixture = await shellFor('admin');

    const link = apiDocsLink(fixture);

    expect(link?.querySelector('.visually-hidden')?.textContent).toContain('pestaña nueva');
    expect(visibleText(link)).not.toContain('pestaña');
  });
});
