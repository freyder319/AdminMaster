import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  private apiUrl = `${environment.apiUrl}/estadisticas`; // cambia por tu backend real

  constructor(private http: HttpClient) {}

  private buildParams(
    periodo?: string,
    mes?: string,
    semana?: string,
    fechaDesde?: string,
    fechaHasta?: string
  ) {
    const params: any = {};
    if (periodo) params.periodo = periodo;
    if (mes) params.mes = mes;
    if (semana) params.semana = semana;
    if (fechaDesde) params.fechaDesde = fechaDesde;
    if (fechaHasta) params.fechaHasta = fechaHasta;
    return params;
  }

  getInventario(periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string): Observable<any> {
    const params = this.buildParams(periodo, mes, semana, fechaDesde, fechaHasta);
    return this.http.get(`${this.apiUrl}/inventario`, { params });
  }

  getComercial(periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string): Observable<any> {
    const params = this.buildParams(periodo, mes, semana, fechaDesde, fechaHasta);
    return this.http.get(`${this.apiUrl}/comercial`, { params });
  }

  getFinanzas(periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string): Observable<any> {
    const params = this.buildParams(periodo, mes, semana, fechaDesde, fechaHasta);
    return this.http.get(`${this.apiUrl}/finanzas`, { params });
  }

  getProductosMasVendidos(periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string): Observable<any[]> {
    const params = this.buildParams(periodo, mes, semana, fechaDesde, fechaHasta);
    return this.http.get<any[]>(`${this.apiUrl}/productos-mas-vendidos`, { params });
  }

  getVentasPorMetodoPago(periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string) {
    const params = this.buildParams(periodo, mes, semana, fechaDesde, fechaHasta);
    return this.http.get(`${this.apiUrl}/ventas-metodo-pago`, { params });
  }

  getVentasPorCategoria(periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string) {
    const params = this.buildParams(periodo, mes, semana, fechaDesde, fechaHasta);
    return this.http.get(`${this.apiUrl}/ventas-categoria`, { params });
  }

  getVentasPorMes(periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string) {
    const params = this.buildParams(periodo, mes, semana, fechaDesde, fechaHasta);
    return this.http.get(`${this.apiUrl}/ventas-por-mes`, { params });
  }

  getProductosRentables(periodo?: string, mes?: string, semana?: string, fechaDesde?: string, fechaHasta?: string) {
    const params = this.buildParams(periodo, mes, semana, fechaDesde, fechaHasta);
    return this.http.get(`${this.apiUrl}/productos-rentables`, { params });
  }
  //Ingresos vs Gastos mensual
  getIngresosVsGastos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/finanzas/ingresos-gastos`);
  }

  // Margen de beneficio
  getMargenBeneficio(): Observable<any> {
    return this.http.get(`${this.apiUrl}/finanzas/margen-beneficio`);
  }

  // Evolución de ganancias mensuales
  getGananciasMensuales(): Observable<any> {
    return this.http.get(`${this.apiUrl}/finanzas/ganancias-mensuales`);
  }

  // Distribución de gastos
  getDistribucionGastos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/finanzas/distribucion-gastos`);
  }

  // Ticket promedio
  getTicketPromedio(): Observable<any> {
    return this.http.get(`${this.apiUrl}/finanzas/ticket-promedio`);
  }
}
