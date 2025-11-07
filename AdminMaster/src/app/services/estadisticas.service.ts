import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  private apiUrl = 'http://localhost:3000/api/estadisticas'; // cambia por tu backend real

  constructor(private http: HttpClient) {}

  getInventario(): Observable<any> {
    return this.http.get(`${this.apiUrl}/inventario`);
  }

  getComercial(): Observable<any> {
    return this.http.get(`${this.apiUrl}/comercial`);
  }

  getFinanzas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/finanzas`);
  }
  getProductosMasVendidos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/productos-mas-vendidos`);
  }
  getVentasPorMetodoPago() {
  return this.http.get(`${this.apiUrl}/ventas-metodo-pago`);
  }

  getVentasPorCategoria() {
    return this.http.get(`${this.apiUrl}/ventas-categoria`);
  }

  getVentasPorMes() {
    return this.http.get(`${this.apiUrl}/ventas-por-mes`);
  }

  getProductosRentables() {
    return this.http.get(`${this.apiUrl}/productos-rentables`);
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
