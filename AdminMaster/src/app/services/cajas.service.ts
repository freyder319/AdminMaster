import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Cajas{
  id:number;
  codigoCaja:string;
  nombre:string;
  estado:string;
}
@Injectable({
  providedIn: 'root'
})
export class CajasService {
  private apiUrl = 'http://localhost:3000/caja';
  constructor(private http: HttpClient) { }

  getCajas(): Observable<Cajas[]> {
    const url = `${this.apiUrl}?t=${Date.now()}`;
    return this.http.get<Cajas[]>(url);
  }

  getCaja(id:number): Observable<Cajas>{
    return this.http.get<Cajas>(`${this.apiUrl}/${id}`);
  }

  createCaja(cajas: Partial<Cajas>): Observable<Cajas>{
    return this.http.post<Cajas>(this.apiUrl,cajas);
  }

  updateCaja(id:number,usuario: Partial<Cajas>): Observable<Cajas>{
    return this.http.put<Cajas>(`${this.apiUrl}/${id}`,usuario);
  }

  deleteCaja(id:number):Observable<void>{
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
