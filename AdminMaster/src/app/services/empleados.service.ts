import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Empleados {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  documento?: string;
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

  enviarCorreoActivacion(correo: string): Observable<any> {
    const body = { correo: correo.trim().toLowerCase() } as any;
    return this.http.post<any>('http://localhost:3000/auth/enviar-activacion-empleado', body);
  }

  deleteEmpleado(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCajas(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/caja'); 
  }

  verificarExistencia(correo: string, telefono: string, documento?: string): Observable<{ correo: boolean, telefono: boolean, documento: boolean }> {
    const params = new URLSearchParams();
    if (correo) params.append('correo', correo);
    if (telefono) params.append('telefono', telefono);
    if (documento) params.append('documento', documento);

    return this.http.get<{ correo: boolean, telefono: boolean, documento: boolean }>(
      `${this.apiUrl}/verificar?${params.toString()}`
    );
  }

}
