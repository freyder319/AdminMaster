import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../config/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  isTokenValid(): boolean {
    if (!this.isBrowser()) return false;
    const token = this.getToken();
    if (!token) return false;
    try {
      const payloadRaw = token.split('.')[1] || '';
      const payload = JSON.parse(atob(payloadRaw));
      const expMs = Number(payload?.exp) * 1000;
      if (!Number.isFinite(expMs)) return false;
      return Date.now() < expMs;
    } catch {
      return false;
    }
  }

  login(correo: string, contrasena: string) {
    return this.http.post<{ access_token: string; rol: string; userId?: number; cajaId?: number }>(
      `${this.apiUrl}/login`,
      { correo, contrasena }
    ).pipe(
      tap(res => {
        if (this.isBrowser()) {
          localStorage.setItem('token', res.access_token);
          const rol = (res.rol || '').trim().toLowerCase();
          localStorage.setItem('rol', rol);
          if (typeof res.userId === 'number') {
            localStorage.setItem('userId', String(res.userId));
          }
          if (rol === 'punto_pos' && res.cajaId !== undefined) {
            localStorage.setItem('cajaId', res.cajaId.toString());
          }
        }
      })
    );
  }

  logout() {
    if (this.isBrowser()) {
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      localStorage.removeItem('userId');
      localStorage.removeItem('cajaId');
    }
  }

  getToken() {
    if (!this.isBrowser()) return null;
    return localStorage.getItem('token');
  }

  getRole() {
    if (!this.isBrowser()) return null;
    const r = localStorage.getItem('rol');
    return r ? r.trim().toLowerCase() : null;
  }

  isLoggedIn() {
    return !!this.getToken();
  }

  verificarCorreo(correo: string) {
    return this.http.get<boolean>(`${this.apiUrl}/usuarios/verificar/${correo}`);
  }

  enviarCorreoRecuperacion(correo: string) {
    return this.http.post(`${this.apiUrl}/usuarios/enviar-recuperacion`, { correo });
  }

  // Llamadas HTTP Correo
  recuperarPorCorreo(correo: string) {
    return this.http.post(`${this.apiUrl}/recuperar-correo`, { correo });
  }

  verificarCodigoCorreo(correo: string, codigo: string) {
    return this.http.post(`${this.apiUrl}/verificar-correo`, { correo, codigo });
  }

  restablecerContrasena(correo: string, nueva: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/restablecer-con-correo`, { correo, nueva });
  }

  activarEmpleado(correo: string, codigo: string, nueva: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/empleado/activar`, { correo, codigo, nueva });
  }

  getCorreoEnvio() {
    return this.http.get(`${this.apiUrl}/correo-envio`, { responseType: 'text' });
  }

  recuperarPorTelefono(telefono: string) {
    return this.http.post(`${this.apiUrl}/recuperar-telefono`, { telefono });
  }

  validarCodigoSMS(telefono: string, codigo: string, nueva: string) {
    return this.http.post(`${this.apiUrl}/validar-codigo-sms`, { telefono, codigo, nueva });
  }
}
