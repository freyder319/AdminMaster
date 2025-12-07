import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.auth.isTokenValid()) {
      const role = this.auth.getRole() ?? '';
      const rolLc = role.toLowerCase();

      if (rolLc === 'admin') {
        return this.router.parseUrl('/movimientos');
      } else if (rolLc === 'punto_pos') {
        return this.router.parseUrl('/turno-empleado');
      } else {
        return this.router.parseUrl('/products');
      }
    }
    return true;
  }
}
