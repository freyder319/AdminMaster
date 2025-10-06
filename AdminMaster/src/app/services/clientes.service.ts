import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Clientes{
  id:number;
  nombre:string;
  apellido:string;
  numero:string;
  correo:string;
  estado:string;
}
@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private apiUrl = 'http://localhost:3000/cliente';
  constructor(private http: HttpClient) { }

  getClientes(): Observable<Clientes[]>{
    return this.http.get<Clientes[]>(this.apiUrl);
  }

  getCliente(id:number): Observable<Clientes>{
    return this.http.get<Clientes>(`${this.apiUrl}/${id}`);
  }

  createCliente(clientes: Partial<Clientes>): Observable<Clientes>{
    return this.http.post<Clientes>(this.apiUrl,clientes);
  }

  updateCliente(id:number,usuario: Partial<Clientes>): Observable<Clientes>{
    return this.http.put<Clientes>(`${this.apiUrl}/${id}`,usuario);
  }

  deleteCliente(id:number):Observable<void>{
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
