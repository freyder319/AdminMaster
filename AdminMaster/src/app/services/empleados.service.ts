import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Empleados {
  id: number;
  correo: string;
  telefono: string;
  contrasena?: string;
  caja?: {
    id: number;
    nombre: string;
    codigoCaja: string;
  };
  cajaId?: number | null; 
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {
  private apiUrl = 'http://localhost:3000/empleado';
  constructor(private http: HttpClient) { }

  getEmpleados(): Observable<Empleados[]> {
    return this.http.get<Empleados[]>(this.apiUrl);
  }

  getEmpleado(id: number): Observable<Empleados> {
    return this.http.get<Empleados>(`${this.apiUrl}/${id}`);
  }

  createEmpleado(empleado: Partial<Empleados>): Observable<Empleados> {
    return this.http.post<Empleados>(this.apiUrl, empleado);
  }

  updateEmpleado(id: number, empleado: Partial<Empleados>): Observable<Empleados> {
    return this.http.put<Empleados>(`${this.apiUrl}/${id}`, empleado);
  }

  deleteEmpleado(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCajas(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/caja'); 
  }

  verificarExistencia(correo: string, telefono: string): Observable<{ correo: boolean, telefono: boolean }> {
    return this.http.get<{ correo: boolean, telefono: boolean }>(
      `${this.apiUrl}/verificar?correo=${correo}&telefono=${telefono}`
    );
  }

}
