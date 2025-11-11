import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
    constructor(private auth: AuthService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const allowedRoles: string[] = route.data['roles'] || [];
        const userRole = (this.auth.getRole() ?? '').toString();
        const allowedLc = allowedRoles.map(r => r?.toString().toLowerCase());
        const userLc = userRole.toLowerCase();

        if (allowedLc.includes(userLc)) {
        return true;
        }

        this.router.navigate(['/login']);
        return false;
    }
}

