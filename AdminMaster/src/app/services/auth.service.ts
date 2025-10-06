import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient) {}

  login(correo: string, contrasena: string) {
    return this.http.post<{ access_token: string; rol: string }>(`${this.apiUrl}/login`, { correo, contrasena })
      .pipe(tap(res => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('rol', res.rol);
      }));
  }

  loginPuntoPos(codigoCaja: string) {
    return this.http.post<{ access_token: string; rol: string; cajaId: number }>(
      `${this.apiUrl}/loginpuntopos`,
      { codigoCaja }
    ).pipe(
      tap(res => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('rol', res.rol);
        localStorage.setItem('cajaId', res.cajaId.toString());
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getRole() {
    return localStorage.getItem('rol');
  }

  isLoggedIn() {
    return !!this.getToken();
  }

  recuperarPorCorreo(correo: string) {
    return this.http.post(`${this.apiUrl}/recuperar-correo`, { correo });
  }

  restablecerContrasena(token: string, nueva: string) {
    return this.http.post(`${this.apiUrl}/restablecer-contrasena`, { token, nueva });
  }

  recuperarPorTelefono(telefono: string) {
    return this.http.post(`${this.apiUrl}/recuperar-telefono`, { telefono });
  }

  validarCodigoSMS(telefono: string, codigo: string, nueva: string) {
    return this.http.post(`${this.apiUrl}/validar-codigo-sms`, { telefono, codigo, nueva });
  }
}
