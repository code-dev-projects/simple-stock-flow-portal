import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionStore } from '../../application/state/session.store';

/**
 * The 422 and the 409 are emitted by the backend ExceptionTranslationFilter: the 422 when an
 * invariant is violated, the 409 when another operation got ahead and the backend already
 * exhausted its retries.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionStore);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        session.clear();
        void router.navigate(['/login']);
      }

      return throwError(() => new Error(describe(error)));
    }),
  );
};

/**
 * The keys of a ValidationProblemDetails are the names the backend binds, in English and
 * sometimes as a JSON path. Only the field is worth showing: its English text never reaches
 * the screen.
 */
const FIELD_LABELS: Record<string, string> = {
  username: 'usuario',
  password: 'contraseña',
  name: 'nombre',
  price: 'precio',
  stock: 'stock',
  categoryid: 'categoría',
  lines: 'líneas de la venta',
  productid: 'producto',
  quantity: 'cantidad',
  from: 'fecha inicial',
  to: 'fecha final',
  file: 'archivo',
  page: 'página',
  size: 'tamaño de página',
  search: 'búsqueda',
};

function describe(error: HttpErrorResponse): string {
  switch (error.status) {
    case 0:
      return 'No hay conexión con el servidor.';
    /**
     * Model validation emits `errors` and, until D-C9 lands in the backend, no `detail`
     * (api-contract.md §2.2). Reading only `detail` turned "the price is not a number" into
     * "something went wrong".
     */
    case 400:
      return (
        error.error?.detail ??
        describeValidationErrors(error.error?.errors) ??
        'La solicitud no es válida.'
      );
    case 401:
      return 'La sesión expiró. Vuelve a iniciar sesión.';
    case 403:
      return 'No tienes permisos para esta acción.';
    case 404:
      return 'El recurso no existe.';
    // Retryable: the backend already tried three times before giving up (ADR-002).
    case 409:
      return error.error?.detail ?? 'Otra operación se adelantó. Vuelve a intentarlo.';
    case 422:
      return error.error?.detail ?? 'La operación viola una regla de negocio.';
    default:
      return error.error?.detail ?? 'Ocurrió un error inesperado.';
  }
}

function describeValidationErrors(errors: unknown): string | null {
  if (errors === null || typeof errors !== 'object') return null;

  const labels = Object.keys(errors)
    .map(fieldOf)
    .filter((field) => field !== '')
    .map((field) => FIELD_LABELS[field] ?? field);

  const distinct = [...new Set(labels)];
  return distinct.length === 0 ? null : `Revisa estos datos: ${distinct.join(', ')}.`;
}

/** "$.lines[0].productId" is the product; "request" is the body itself and names no field. */
function fieldOf(key: string): string {
  const leaf = key
    .replace(/\[\d+\]/g, '')
    .split('.')
    .filter((segment) => segment !== '' && segment !== '$')
    .at(-1);

  const normalized = leaf?.toLowerCase() ?? '';
  return normalized === 'request' ? '' : normalized;
}
