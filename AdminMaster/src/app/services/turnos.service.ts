import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, timer, of, OperatorFunction } from 'rxjs';
import { mergeMap, tap, retryWhen, scan, catchError, shareReplay, finalize } from 'rxjs/operators';

export interface TurnoResumen {
  turno: {
    inicioTurno: Date;
    finTurno: Date;
    observaciones?: string;
  };
  aperturaCaja: {
    fecha: Date;
    montoInicial: number;
  };
  cierreCaja: {
    fecha: Date;
    montoFinal: number;
  };
  actividad: {
    totalVentas: number;
    transacciones: number;
    totalVentasLibres: number;
    transaccionesLibres: number;
    totalGastos: number;
    cantidadGastos: number;
    ventas: Array<{ id: number; total: number; nombre?: string | null; cantidad?: number | null }>;
    ventasLibres: Array<{ id: number; total: number; nombre?: string | null; cantidad?: number | null }>;
    gastos: Array<{ id: number; monto: number; nombre?: string | null; forma_pago?: string | null }>;
  };
}

export interface TurnoActivoItem {
  usuarioId: number;
  correo: string;
  nombre?: string;
  apellido?: string;
  // Alternative optional fields that some endpoints might return
  empleadoNombre?: string;
  empleadoApellido?: string;
  nombres?: string;
  apellidos?: string;
  fullName?: string;
  nombreCompleto?: string;
  resumen: TurnoResumen;
}

@Injectable({
  providedIn: 'root'
})
export class TurnosService {
  private apiUrl = 'http://localhost:3000/turno'; 

  constructor(private http: HttpClient) {}

  // Cache sencillo en memoria para endpoints públicos
  private cacheActivosPublic: { data: TurnoActivoItem[]; ts: number } | null = null;
  private cacheCerradosPublic: { data: TurnoActivoItem[]; ts: number } | null = null;
  private cacheTtlMs = 60_000; // 60s
  private inflightActivos$?: Observable<TurnoActivoItem[]>;
  private inflightCerrados$?: Observable<TurnoActivoItem[]>;

  private retryOn429<T>(maxRetries: number = 3, baseDelayMs: number = 1000): OperatorFunction<T, T> {
    type RetryState = { count: number; delayMs: number };
    return retryWhen<T>((errors: Observable<any>) =>
      errors.pipe(
        scan((state: RetryState, err: any) => {
          const status = err?.status;
          if (status === 429 && state.count < maxRetries) {
            // Intentar leer Retry-After (segundos) del backend
            let retryAfterMs = 0;
            try {
              const hdr = err?.headers?.get?.('Retry-After');
              const seconds = hdr ? Number(hdr) : NaN;
              if (!isNaN(seconds) && seconds > 0) retryAfterMs = seconds * 1000;
            } catch {}
            const base = state.count > 0 ? baseDelayMs * Math.pow(2, state.count - 1) : 0;
            const jitter = Math.floor(Math.random() * 300);
            const delayMs = Math.max(retryAfterMs, base + jitter);
            return { count: state.count + 1, delayMs } as RetryState;
          }
          throw err;
        }, { count: 0, delayMs: 0 } as RetryState),
        mergeMap((s: RetryState) => timer(s.delayMs))
      )
    );
  }

  private authOptions() {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
        }
      }
    } catch {}
    return {};
  }

  getResumenTurno(empleadoId: number): Observable<TurnoResumen> {
    return this.http.get<TurnoResumen>(`${this.apiUrl}/resumen/${empleadoId}`, this.authOptions());
  }

  iniciarTurno(montoInicial: number, observaciones?: string, registroTurnoId?: number): Observable<TurnoResumen> {
    const payload: any = { montoInicial };
    if (typeof observaciones === 'string' && observaciones.trim().length > 0) {
      payload.observaciones = observaciones.trim();
    }
    if (typeof registroTurnoId === 'number' && !isNaN(registroTurnoId)) {
      payload.registroTurnoId = registroTurnoId;
    }
    return this.http.post<TurnoResumen>(`${this.apiUrl}/iniciar`, payload, this.authOptions());
  }

  iniciarTurnoPorUsuario(usuarioId: number, montoInicial: number, observaciones?: string, registroTurnoId?: number): Observable<TurnoResumen> {
    // Fallback sin Authorization
    const payload: any = { montoInicial };
    if (typeof observaciones === 'string' && observaciones.trim().length > 0) {
      payload.observaciones = observaciones.trim();
    }
    if (typeof registroTurnoId === 'number' && !isNaN(registroTurnoId)) {
      payload.registroTurnoId = registroTurnoId;
    }
    return this.http.post<TurnoResumen>(`${this.apiUrl}/iniciar-por-usuario/${usuarioId}`, payload);
  }

  cerrarTurno(montoFinal: number): Observable<TurnoResumen> {
    return this.http.post<TurnoResumen>(`${this.apiUrl}/cerrar`, { montoFinal }, this.authOptions());
  }

  cerrarTurnoPorUsuario(usuarioId: number, montoFinal: number): Observable<TurnoResumen> {
    // Fallback sin Authorization
    return this.http.post<TurnoResumen>(`${this.apiUrl}/cerrar-por-usuario/${usuarioId}`, { montoFinal });
  }

  getTurnoActivo(): Observable<TurnoResumen> {
    return this.http.get<TurnoResumen>(`${this.apiUrl}/activo`, this.authOptions());
  }

  getUltimoTurno(empleadoId: number): Observable<TurnoResumen> {
    return this.http.get<TurnoResumen>(`${this.apiUrl}/ultimo/${empleadoId}`, this.authOptions());
  }

  getTurnosActivos(): Observable<TurnoActivoItem[]> {
    return this.http.get<TurnoActivoItem[]>(`${this.apiUrl}/activos`, this.authOptions());
  }

  getTurnosActivosPublic(): Observable<TurnoActivoItem[]> {
    const now = Date.now();
    if (this.cacheActivosPublic && (now - this.cacheActivosPublic.ts) < this.cacheTtlMs) {
      return of(this.cacheActivosPublic.data);
    }
    if (this.inflightActivos$) return this.inflightActivos$;
    this.inflightActivos$ = this.http.get<TurnoActivoItem[]>(`${this.apiUrl}/activos-public`).pipe(
      tap(data => { this.cacheActivosPublic = { data: data || [], ts: Date.now() }; }),
      catchError(() => of(this.cacheActivosPublic?.data || [])),
      finalize(() => { this.inflightActivos$ = undefined; }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    return this.inflightActivos$;
  }

  getTurnosCerrados(): Observable<TurnoActivoItem[]> {
    return this.http.get<TurnoActivoItem[]>(`${this.apiUrl}/cerrados`, this.authOptions());
  }

  getTurnosCerradosPublic(): Observable<TurnoActivoItem[]> {
    const now = Date.now();
    if (this.cacheCerradosPublic && (now - this.cacheCerradosPublic.ts) < this.cacheTtlMs) {
      return of(this.cacheCerradosPublic.data);
    }
    if (this.inflightCerrados$) return this.inflightCerrados$;
    this.inflightCerrados$ = this.http.get<TurnoActivoItem[]>(`${this.apiUrl}/cerrados-public`).pipe(
      tap(data => { this.cacheCerradosPublic = { data: data || [], ts: Date.now() }; }),
      catchError(() => of(this.cacheCerradosPublic?.data || [])),
      finalize(() => { this.inflightCerrados$ = undefined; }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    return this.inflightCerrados$;
  }
}
