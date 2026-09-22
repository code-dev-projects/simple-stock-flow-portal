import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { errorInterceptor } from '../../../../infrastructure/interceptors/error.interceptor';
import { infrastructureProviders } from '../../../../infrastructure/providers';
import { SellerFormPage } from './seller-form.page';

const CREATED = { id: '77777777-7777-4777-8777-777777777777' };

describe('SellerFormPage', () => {
  let fixture: ComponentFixture<SellerFormPage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerFormPage],
      providers: [
        // The 422 and the 403 only become Spanish inside the interceptor, so the spec walks the
        // same path the browser walks instead of asserting on a raw HttpErrorResponse.
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        ...infrastructureProviders,
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SellerFormPage);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function fill(username: string, password: string): void {
    const user: HTMLInputElement = fixture.nativeElement.querySelector('input[type="text"]');
    const password_: HTMLInputElement =
      fixture.nativeElement.querySelector('input[type="password"]');

    user.value = username;
    user.dispatchEvent(new Event('input'));
    password_.value = password;
    password_.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(): void {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  /** whenStable resolves one microtask deep; the chain behind the button is longer than that. */
  async function settle(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  function errorText(): string | undefined {
    return fixture.nativeElement.querySelector('[role="alert"]')?.textContent;
  }

  it('registers the new user as a seller and never as anything else (DP-04, E-02)', async () => {
    fill('vendedor.nuevo', 'clave-de-prueba');
    submit();

    const request = httpMock.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      username: 'vendedor.nuevo',
      password: 'clave-de-prueba',
      role: 'seller',
    });

    request.flush(CREATED, { status: 201, statusText: 'Created' });
    await settle();
  });

  it('offers no role control, because there is nothing to choose (DP-04)', () => {
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('input[type="radio"]').length).toBe(0);
    expect(fixture.nativeElement.querySelector('.alert--info')?.textContent).toContain(
      'administrador',
    );
  });

  it('confirms with the name it created and leaves the form ready for the next one', async () => {
    fill('vendedor.nuevo', 'clave-de-prueba');
    submit();

    httpMock
      .expectOne('/api/auth/register')
      .flush(CREATED, { status: 201, statusText: 'Created' });
    await settle();

    expect(fixture.nativeElement.querySelector('.alert--success')?.textContent).toContain(
      'vendedor.nuevo',
    );

    const user: HTMLInputElement = fixture.nativeElement.querySelector('input[type="text"]');
    const password: HTMLInputElement = fixture.nativeElement.querySelector('input[type="password"]');
    expect(user.value).toBe('');
    expect(password.value).toBe('');
  });

  it('repeats the words the server chose when the username is taken (422)', async () => {
    fill('admin', 'clave-de-prueba');
    submit();

    httpMock.expectOne('/api/auth/register').flush(
      { title: 'Regla de negocio violada', status: 422, detail: "El usuario 'admin' ya existe." },
      { status: 422, statusText: 'Unprocessable Content' },
    );
    await settle();

    expect(errorText()).toContain("El usuario 'admin' ya existe.");
    expect(fixture.nativeElement.querySelector('.alert--success')).toBeNull();
  });

  it('tells a seller in Spanish that the sign-up is not theirs (403)', async () => {
    fill('vendedor.nuevo', 'clave-de-prueba');
    submit();

    httpMock
      .expectOne('/api/auth/register')
      .flush(null, { status: 403, statusText: 'Forbidden' });
    await settle();

    expect(errorText()).toContain('No tienes permisos para esta acción.');
  });

  it('names the field the server rejected when it answers 400', async () => {
    fill('vendedor.nuevo', 'clave-de-prueba');
    submit();

    httpMock
      .expectOne('/api/auth/register')
      .flush(
        { status: 400, errors: { username: ['The Username field is required.'] } },
        { status: 400, statusText: 'Bad Request' },
      );
    await settle();

    expect(errorText()).toContain('usuario');
  });

  it('keeps the button shut until both the username and the password are there', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBeTrue();

    fill('vendedor.nuevo', '');
    expect(button.disabled).toBeTrue();

    fill('vendedor.nuevo', 'clave-de-prueba');
    expect(button.disabled).toBeFalse();
  });
});
