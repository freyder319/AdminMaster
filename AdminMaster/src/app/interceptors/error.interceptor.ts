import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

export function errorInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Normalizar mensajes
      let message = 'Error inesperado';
      if (err.error?.message) {
        message = err.error.message;
      } else if (err.status === 0) {
        message = 'No hay conexión con el servidor';
      } else if (err.status === 401) {
        message = 'Sesión expirada o no autorizada';
      } else if (err.status === 403) {
        message = 'Acceso denegado';
      } else if (err.status === 404) {
        message = 'Recurso no encontrado';
      } else if (err.status >= 500) {
        message = 'Error en el servidor. Intenta más tarde';
      }
      // Opcional: emitir evento/toast global. Por ahora, adjuntamos un mensaje normalizado
      const normalized = new HttpErrorResponse({
        error: { ...(err.error || {}), message },
        headers: err.headers,
        status: err.status,
        statusText: err.statusText,
        url: err.url || undefined,
      });
      return throwError(() => normalized);
    })
  );
}
