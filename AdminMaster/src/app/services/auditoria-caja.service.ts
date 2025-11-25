import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditoriaCaja {
  id: number;
  turnoId: number;
  usuarioId: number | null;
  cajaId: number | null;
  saldoInicial: number;
  saldoFinal: number;
  saldoEsperado: number;
  diferencia: number;
  fechaHoraCierre: string;
}

@Injectable({ providedIn: 'root' })
export class AuditoriaCajaService {
  private apiUrl = 'http://localhost:3000/turno/auditoria';

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

  list(params?: { from?: string; to?: string; usuarioId?: number; cajaId?: number }): Observable<AuditoriaCaja[]> {
    let httpParams = new HttpParams();
    if (params?.from) httpParams = httpParams.set('from', params.from);
    if (params?.to) httpParams = httpParams.set('to', params.to);
    if (params?.usuarioId) httpParams = httpParams.set('usuarioId', String(params.usuarioId));
    if (params?.cajaId) httpParams = httpParams.set('cajaId', String(params.cajaId));

    return this.http.get<AuditoriaCaja[]>(this.apiUrl, { params: httpParams, ...this.authOptions() });
  }
}
