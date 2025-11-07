import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const stored = (localStorage.getItem('rol') || '').trim().toLowerCase();
    const allowed: string[] = (route.data?.['roles'] as string[]) || [];
    if (!stored) {
      this.router.navigate(['/login']);
      return false;
    }
    if (allowed.length === 0 || allowed.includes(stored)) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
