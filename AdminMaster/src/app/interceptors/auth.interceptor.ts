import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  const handleExpired = () => {
    try { localStorage.removeItem('token'); localStorage.removeItem('rol'); localStorage.removeItem('userId'); localStorage.removeItem('cajaId'); } catch {}
    try {
      Swal.fire({ icon: 'warning', title: 'Sesión expirada', text: 'Por favor, vuelve a iniciar sesión.', confirmButtonColor: 'brown' });
    } catch {}
    try { router.navigate(['/login']); } catch {}
  };

  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      let expired = false;
      if (token) {
        try {
          const payloadRaw = token.split('.')[1] || '';
          const payload = JSON.parse(atob(payloadRaw));
          const expMs = Number(payload?.exp) * 1000;
          if (Number.isFinite(expMs) && Date.now() >= expMs) {
            expired = true;
          }
        } catch {}
        if (!expired) {
          req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
        } else {
          handleExpired();
        }
      }
    }
  } catch {}

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err?.status === 401 || err?.status === 403) {
        handleExpired();
      }
      return throwError(() => err);
    })
  );
};
