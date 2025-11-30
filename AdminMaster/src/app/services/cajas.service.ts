import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';

export interface Cajas {
  id: number;
  codigoCaja: string;
  nombre: string;
  estado: string;
  // opcional: si tu backend devuelve timestamps
  creadoEn?: string;
  actualizadoEn?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CajasService {
  private apiUrl = `${environment.apiUrl}/caja`;

  constructor(private http: HttpClient) {}

  getCajas(): Observable<Cajas[]> {
    return this.http.get<Cajas[]>(this.apiUrl);
  }

  getCaja(id: number): Observable<Cajas> {
    return this.http.get<Cajas>(`${this.apiUrl}/${id}`);
  }

  // CORREGIDO: tipado estricto, solo envía los campos que espera el DTO
  createCaja(caja: { codigoCaja: string; nombre: string; estado?: string }): Observable<Cajas> {
    return this.http.post<Cajas>(this.apiUrl, caja, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  updateCaja(id: number, caja: { codigoCaja?: string; nombre?: string; estado?: string }): Observable<Cajas> {
    return this.http.put<Cajas>(`${this.apiUrl}/${id}`, caja, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  deleteCaja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

