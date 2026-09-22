import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { infrastructureProviders } from '../../../../infrastructure/providers';
import { LoginPage } from './login.page';

const configuredProjectPageUrl = environment.projectPageUrl;

/**
 * An address no source file carries. Asserting against environment.projectPageUrl would pass
 * just as well if the component held its own copy of the real address.
 */
const standInProjectPageUrl = 'https://stand-in.example/project-page/';

/** What a sighted visitor reads: the screen-reader-only notice is not part of it. */
function visibleText(element: Element | null): string {
  if (element === null) return '';

  const copy = element.cloneNode(true) as Element;
  copy.querySelectorAll('.visually-hidden').forEach((hidden) => hidden.remove());
  return (copy.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ...infrastructureProviders,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    environment.projectPageUrl = configuredProjectPageUrl;
  });

  /** The component reads the configuration when it is built, so every test renders on demand. */
  function render(): void {
    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
  }

  function projectLink(): HTMLAnchorElement | null {
    return fixture.nativeElement.querySelector('a.auth__project-link');
  }

  it('gives a visitor with no credentials somewhere to go', () => {
    render();

    const link = projectLink();

    expect(link)
      .withContext('the sign-in screen is a dead end for anyone without an account')
      .not.toBeNull();
    expect(visibleText(link))
      .withContext('the link renders with nothing a sighted visitor can read')
      .toContain('Descubre qué hace Simple Stock Flow');
  });

  it('takes the project page address from configuration, not from a copy of its own', () => {
    environment.projectPageUrl = standInProjectPageUrl;

    render();

    expect(projectLink()?.getAttribute('href')).toBe(standInProjectPageUrl);
  });

  it('opens the project page in another tab without handing it the opener window', () => {
    render();

    expect(projectLink()?.getAttribute('target')).toBe('_blank');
    expect(projectLink()?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('announces the new tab to assistive technology only', () => {
    render();

    const link = projectLink();

    expect(link?.querySelector('.visually-hidden')?.textContent)
      .withContext('a screen reader gets no warning that the link leaves the portal')
      .toContain('pestaña nueva');
    expect(visibleText(link))
      .withContext('the header cannot show this notice, so neither screen shows it')
      .not.toContain('pestaña');
  });
});
