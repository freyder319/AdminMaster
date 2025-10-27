import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
}

@Injectable({ providedIn: 'root' })
export class VentaLibreService {
  private apiUrl = 'http://localhost:3000/venta-libre';

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

  create(data: CreateVentaLibrePayload): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.apiUrl, data, this.authOptions());
  }
}
