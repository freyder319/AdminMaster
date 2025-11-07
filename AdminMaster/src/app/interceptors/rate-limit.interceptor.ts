import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { retryWhen, scan, mergeMap } from 'rxjs/operators';

export const rateLimitInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    retryWhen((errors: Observable<any>) =>
      errors.pipe(
        scan((state: { count: number; delayMs: number }, err: any) => {
          const status = err?.status;
          if (status === 429 && state.count < 3) {
            let retryAfterMs = 0;
            try {
              const hdr = err?.headers?.get?.('Retry-After');
              const seconds = hdr ? Number(hdr) : NaN;
              if (!isNaN(seconds) && seconds > 0) retryAfterMs = seconds * 1000;
            } catch {}
            const backoffMs = 1500 * Math.pow(2, state.count);
            const delayMs = Math.max(retryAfterMs, backoffMs);
            return { count: state.count + 1, delayMs };
          }
          throw err;
        }, { count: 0, delayMs: 0 }),
        mergeMap((s) => timer(s.delayMs))
      )
    )
  );
};
