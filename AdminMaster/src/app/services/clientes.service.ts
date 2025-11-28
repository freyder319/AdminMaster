import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';

export interface Clientes{
  id:number;
  nombre:string;
  apellido:string;
  numero:string;
  correo:string;
  estado:string;
  documento?: string;
}
@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private apiUrl = `${environment.apiUrl}/cliente`;
  constructor(private http: HttpClient) { }

  private authOptions() {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          return { headers: { Authorization: `Bearer ${token}` } as any };
        }
      }
    } catch {}
    return {};
  }

  getClientes(): Observable<Clientes[]>{
    return this.http.get<Clientes[]>(this.apiUrl, this.authOptions());
  }

  getCliente(id:number): Observable<Clientes>{
    return this.http.get<Clientes>(`${this.apiUrl}/${id}`, this.authOptions());
  }

  createCliente(clientes: Partial<Clientes>): Observable<Clientes>{
    return this.http.post<Clientes>(this.apiUrl, clientes, this.authOptions());
  }

  updateCliente(id:number,usuario: Partial<Clientes>): Observable<Clientes>{
    return this.http.put<Clientes>(`${this.apiUrl}/${id}`, usuario, this.authOptions());
  }

  deleteCliente(id:number):Observable<void>{
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.authOptions());
  }

  verificarExistencia(correo: string, numero: string, documento: string): Observable<{ correo: boolean; numero: boolean; documento: boolean }> {
    const params = `?correo=${encodeURIComponent(correo)}&numero=${encodeURIComponent(numero)}&documento=${encodeURIComponent(documento)}`;
    return this.http.get<{ correo: boolean; numero: boolean; documento: boolean }>(`${this.apiUrl}/verificar${params}`, this.authOptions());
  }
}
