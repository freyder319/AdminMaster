import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
    constructor(private auth: AuthService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (!this.auth.isTokenValid()) {
            console.log('[RoleGuard] token no válido, redirigiendo a /login');
            this.auth.logout();
            this.router.navigate(['/login']);
            return false;
        }

        const allowedRoles: string[] = route.data['roles'] || [];
        const userRole = (this.auth.getRole() ?? '').toString();
        const allowedLc = allowedRoles.map(r => r?.toString().toLowerCase());
        const userLc = userRole.toLowerCase();

        console.log('[RoleGuard] ruta:', state.url, 'roles permitidos:', allowedLc, 'rol usuario:', userLc);

        if (allowedLc.includes(userLc)) {
            console.log('[RoleGuard] acceso PERMITIDO');
            return true;
        }

        console.log('[RoleGuard] acceso DENEGADO, redirigiendo a /login');
        this.router.navigate(['/login']);
        return false;
    }
}
