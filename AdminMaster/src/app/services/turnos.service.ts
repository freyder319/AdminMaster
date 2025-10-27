import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    ventas: Array<{ id: number; total: number }>;
    ventasLibres: Array<{ id: number; total: number }>;
    gastos: Array<{ id: number; monto: number; nombre?: string | null; forma_pago?: string | null }>;
  };
}

export interface TurnoActivoItem {
  usuarioId: number;
  correo: string;
  resumen: TurnoResumen;
}

@Injectable({
  providedIn: 'root'
})
export class TurnosService {
  private apiUrl = 'http://localhost:3000/turno'; 

  constructor(private http: HttpClient) {}

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

  iniciarTurno(montoInicial: number, observaciones?: string): Observable<TurnoResumen> {
    return this.http.post<TurnoResumen>(`${this.apiUrl}/iniciar`, { montoInicial, observaciones }, this.authOptions());
  }

  iniciarTurnoPorUsuario(usuarioId: number, montoInicial: number, observaciones?: string): Observable<TurnoResumen> {
    // Fallback sin Authorization
    return this.http.post<TurnoResumen>(`${this.apiUrl}/iniciar-por-usuario/${usuarioId}`, { montoInicial, observaciones });
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
    return this.http.get<TurnoActivoItem[]>(`${this.apiUrl}/activos-public`);
  }

  getTurnosCerrados(): Observable<TurnoActivoItem[]> {
    return this.http.get<TurnoActivoItem[]>(`${this.apiUrl}/cerrados`, this.authOptions());
  }

  getTurnosCerradosPublic(): Observable<TurnoActivoItem[]> {
    return this.http.get<TurnoActivoItem[]>(`${this.apiUrl}/cerrados-public`);
  }
}
