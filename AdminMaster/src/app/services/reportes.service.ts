import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private baseUrl = 'http://localhost:3000';

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

  getVentasPorEmpleado(params?: { from?: string; to?: string }): Observable<{ usuarioId: number; cantidadVentas: number; totalVentas: number }[]> {
    let p = new HttpParams();
    if (params?.from) p = p.set('from', params.from);
    if (params?.to) p = p.set('to', params.to);
    return this.http.get<{ usuarioId: number; cantidadVentas: number; totalVentas: number }[]>(
      `${this.baseUrl}/venta/por-empleado`,
      { params: p, ...this.authOptions() },
    );
  }

  getHorasPorEmpleado(params?: { from?: string; to?: string }): Observable<{ usuarioId: number; horasTrabajadas: number }[]> {
    let p = new HttpParams();
    if (params?.from) p = p.set('from', params.from);
    if (params?.to) p = p.set('to', params.to);
    return this.http.get<{ usuarioId: number; horasTrabajadas: number }[]>(
      `${this.baseUrl}/turno/horas-por-empleado`,
      { params: p, ...this.authOptions() },
    );
  }

  getVentasPorProducto(params?: { from?: string; to?: string }): Observable<{ productoId: number; nombreProducto: string; cantidadVendida: number; totalVendido: number }[]> {
    let p = new HttpParams();
    if (params?.from) p = p.set('from', params.from);
    if (params?.to) p = p.set('to', params.to);
    return this.http.get<{ productoId: number; nombreProducto: string; cantidadVendida: number; totalVendido: number }[]>(
      `${this.baseUrl}/venta/por-producto`,
      { params: p, ...this.authOptions() },
    );
  }

  getVentasPorCategoria(params?: { from?: string; to?: string }): Observable<{ categoriaId: number | null; nombreCategoria: string; cantidadVendida: number; totalVendido: number }[]> {
    let p = new HttpParams();
    if (params?.from) p = p.set('from', params.from);
    if (params?.to) p = p.set('to', params.to);
    return this.http.get<{ categoriaId: number | null; nombreCategoria: string; cantidadVendida: number; totalVendido: number }[]>(
      `${this.baseUrl}/venta/por-categoria`,
      { params: p, ...this.authOptions() },
    );
  }
}
