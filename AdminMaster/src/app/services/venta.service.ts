import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';

export interface VentaItemDTO {
  productoId: number;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface CreateVentaPayload {
  total: number;
  forma_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'otros';
  estado?: 'confirmada' | 'pendiente';
  observaciones?: string;
  usuario_id?: number;
  turno_id?: number;
  fecha_hora?: string;
  descuentoId?: number;
  clienteId?: number;
  items: VentaItemDTO[];
  transaccionId?: string;
}

@Injectable({ providedIn: 'root' })
export class VentaService {
  private apiUrl = `${environment.apiUrl}/venta`;

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

  create(data: CreateVentaPayload): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.apiUrl, data, this.authOptions());
  }

  list(filters?: {
    forma_pago?: CreateVentaPayload['forma_pago'] | '';
    clienteId?: number | '';
    proveedorId?: number | '';
    limit?: number;
  }): Observable<any[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.forma_pago) params = params.set('forma_pago', String(filters.forma_pago));
      if (filters.clienteId) params = params.set('clienteId', String(filters.clienteId));
      if (filters.proveedorId) params = params.set('proveedorId', String(filters.proveedorId));
      if (typeof filters.limit === 'number') params = params.set('limit', String(filters.limit));
    }
    return this.http.get<any[]>(this.apiUrl, { params, ...this.authOptions() });
  }
}
