import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';

export interface ConfiguracionNegocio {
  id?: number;
  nombreNegocio: string;
  direccion: string;
  ciudad: string;
  celular: string;
  correo: string;
  documento: string;
  logoUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private apiUrl = `${environment.apiUrl}/configuracion`;
  constructor(private http: HttpClient) {}

  get(): Observable<ConfiguracionNegocio | null> {
    return this.http.get<ConfiguracionNegocio | null>(this.apiUrl);
  }
  create(data: Omit<ConfiguracionNegocio, 'id'>): Observable<ConfiguracionNegocio> {
    return this.http.post<ConfiguracionNegocio>(this.apiUrl, data);
  }
  update(id: number, data: Partial<ConfiguracionNegocio>): Observable<ConfiguracionNegocio> {
    return this.http.put<ConfiguracionNegocio>(`${this.apiUrl}/${id}`, data);
  }
  uploadLogo(payload: { imageBase64: string }): Observable<ConfiguracionNegocio> {
    return this.http.post<ConfiguracionNegocio>(`${this.apiUrl}/logo`, payload);
  }
}
