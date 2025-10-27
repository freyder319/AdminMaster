import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { PasswordRecoveryFlowService } from '../services/password-recovery-flow.service';

@Injectable({ providedIn: 'root' })
export class RecoveryEmailGuard implements CanActivate {
  constructor(private flow: PasswordRecoveryFlowService, private router: Router) {}
  canActivate(): boolean | UrlTree {
    if (this.flow.isEmailSent() && !this.flow.isExpired()) return true;
    // Si expiró o no se envió, volver a inicio del flujo
    return this.router.parseUrl('/verificar-email');
  }
}
