import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

// Simple global semaphore to limit concurrent HTTP requests
const MAX_CONCURRENT = 2;
let inFlight = 0;
const queue: Subject<void>[] = [];

function acquire(): Observable<void> {
  if (inFlight < MAX_CONCURRENT) {
    inFlight++;
    const s = new Subject<void>();
    // emit immediately
    setTimeout(() => s.next());
    return s.asObservable();
  }
  const gate = new Subject<void>();
  queue.push(gate);
  return gate.asObservable();
}

function release() {
  inFlight = Math.max(0, inFlight - 1);
  const next = queue.shift();
  if (next) {
    // allow next tick to avoid synchronous re-entry
    setTimeout(() => next.next());
  }
}

export const concurrencyInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  return acquire().pipe(
    switchMap(() => next(req).pipe(finalize(() => release())))
  );
};
