import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Session } from '../../domain/models/session.model';
import { SessionStoragePort } from '../../application/ports/auth-repository.port';
import { errorInterceptor } from './error.interceptor';

class MemorySessionStorage extends SessionStoragePort {
  read(): Session | null {
    return null;
  }
  write(): void {}
  clear(): void {}
}

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SessionStoragePort, useClass: MemorySessionStorage },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  /** Flushes the given body with the given status and returns the message the person reads. */
  function messageFor(body: object | null, status: number): string {
    let message = '';
    http.get('/api/products').subscribe({ error: (error: Error) => (message = error.message) });
    httpMock
      .expectOne('/api/products')
      .flush(body, { status, statusText: 'Error' });
    return message;
  }

  it('names the field that failed when the 400 carries errors and no detail', () => {
    const message = messageFor(
      {
        type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: {
          request: ['The request field is required.'],
          '$.price': ['The JSON value could not be converted.'],
        },
        traceId: '00-d912cc8420498377da97ac6103994763-961f57e265731567-00',
      },
      400,
    );

    expect(message).toContain('precio');
    expect(message).not.toBe('Ocurrió un error inesperado.');
  });

  it('reads a nested field name out of the JSON path', () => {
    const message = messageFor(
      {
        status: 400,
        errors: { '$.lines[0].productId': ['The JSON value could not be converted.'] },
      },
      400,
    );

    expect(message).toContain('producto');
  });

  it('prefers detail over errors once the backend sends it (D-C9)', () => {
    const message = messageFor(
      {
        status: 400,
        detail: 'El precio debe ser un número.',
        errors: { '$.price': ['The JSON value could not be converted.'] },
      },
      400,
    );

    expect(message).toBe('El precio debe ser un número.');
  });

  it('falls back to a generic message when the 400 names no field', () => {
    expect(messageFor({ status: 400 }, 400)).toBe('La solicitud no es válida.');
  });

  it('keeps reading detail on a 422', () => {
    const body = { title: 'Regla de negocio violada', status: 422, detail: 'Stock insuficiente.' };
    expect(messageFor(body, 422)).toBe('Stock insuficiente.');
  });

  it('keeps the generic message for a 500 with an empty body', () => {
    expect(messageFor(null, 500)).toBe('Ocurrió un error inesperado.');
  });
});
