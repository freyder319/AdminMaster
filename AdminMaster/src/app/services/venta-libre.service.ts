import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../config/environment';

export interface VentaLibreProducto {
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface CreateVentaLibrePayload {
  nombre: string;
  estado: 'confirmada' | 'pendiente' | 'anulada';
  fecha_hora?: string;
  productos: VentaLibreProducto[];
  total: string; // '12.34'
  forma_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'otros';
  usuario_id?: number;
  observaciones?: string;
  tipo_venta: 'libre';
  turno_id?: number;
  transaccionId?: string;
}

@Injectable({ providedIn: 'root' })
export class VentaLibreService {
  private apiUrl = `${environment.apiUrl}/venta-libre`;

  constructor(private http: HttpClient) {}
  private readonly _refresh$ = new Subject<void>();
  readonly refresh$ = this._refresh$.asObservable();

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

  create(data: CreateVentaLibrePayload): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.apiUrl, data, this.authOptions()).pipe(
      tap(() => {
        this._refresh$.next();
      })
    );
  }

  list(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, this.authOptions());
  }

  update(id: number, changes: Partial<CreateVentaLibrePayload>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, changes, this.authOptions());
  }

  updateEstado(id: number, estado: 'confirmada' | 'pendiente' | 'anulada'): Observable<any> {
    return this.update(id, { estado });
  }
}
