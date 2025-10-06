import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
    constructor(private auth: AuthService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const allowedRoles: string[] = route.data['roles'];
        const userRole = this.auth.getRole() ?? '';

        if (allowedRoles.includes(userRole)) {
        return true;
        }

        this.router.navigate(['/unauthorized']);
        return false;
    }
}

