import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient) {}

  login(correo: string, contrasena: string) {
    return this.http.post<{ access_token: string; rol: string; cajaId?: number }>(
      `${this.apiUrl}/login`,
      { correo, contrasena }
    ).pipe(
      tap(res => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('rol', res.rol);

        if (res.rol === 'punto_pos' && res.cajaId !== undefined) {
          localStorage.setItem('cajaId', res.cajaId.toString());
        }
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

  restablecerContrasena(correo: string, nueva: string) {
    return this.http.post(`${this.apiUrl}/restablecer-con-correo`, { correo, nueva });
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
