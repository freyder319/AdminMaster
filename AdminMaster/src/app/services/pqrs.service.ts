import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer, OperatorFunction } from 'rxjs';
import { retryWhen, scan, mergeMap, tap, catchError, shareReplay, finalize } from 'rxjs/operators';

export interface CreatePqrs {
  nombre: string;
  apellido: string;
  correo: string;
  numero: string;
  comentarios: string;
  autorizo: boolean;
}

@Injectable({ providedIn: 'root' })
export class PqrsService {
  private apiUrl = 'http://localhost:3000/pqrs';
  constructor(private http: HttpClient) {}

  private cacheAll: { data: any[]; ts: number } | null = null;
  private cacheTtlMs = 60_000; // 60s
  private inflightAll$?: Observable<any[]>;

  private retryOn429<T>(maxRetries: number = 5, baseDelayMs: number = 1500): OperatorFunction<T, T> {
    type RetryState = { count: number; delayMs: number };
    return retryWhen<T>((errors: Observable<any>) =>
      errors.pipe(
        scan((state: RetryState, err: any) => {
          const status = err?.status;
          if (status === 429 && state.count < maxRetries) {
            let retryAfterMs = 0;
            try {
              const hdr = err?.headers?.get?.('Retry-After');
              const seconds = hdr ? Number(hdr) : NaN;
              if (!isNaN(seconds) && seconds > 0) retryAfterMs = seconds * 1000;
            } catch {}
            const backoffMs = baseDelayMs * Math.pow(2, state.count);
            const jitter = Math.floor(Math.random() * 300);
            const delayMs = Math.max(retryAfterMs, backoffMs) + jitter;
            return { count: state.count + 1, delayMs } as RetryState;
          }
          throw err;
        }, { count: 0, delayMs: 0 } as RetryState),
        mergeMap((s: RetryState) => timer(s.delayMs))
      )
    );
  }

  crearPqrs(data: CreatePqrs): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  obtenerTodas(): Observable<any[]> {
    const now = Date.now();
    if (this.cacheAll && (now - this.cacheAll.ts) < this.cacheTtlMs) {
      return of(this.cacheAll.data);
    }
    if (this.inflightAll$) return this.inflightAll$;
    this.inflightAll$ = this.http.get<any[]>(this.apiUrl).pipe(
      tap(data => { this.cacheAll = { data: data || [], ts: Date.now() }; }),
      catchError(() => of(this.cacheAll?.data || [])),
      finalize(() => { this.inflightAll$ = undefined; }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    return this.inflightAll$;
  }
}
