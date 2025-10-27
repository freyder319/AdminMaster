import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { PasswordRecoveryFlowService } from '../services/password-recovery-flow.service';

@Injectable({ providedIn: 'root' })
export class RecoveryVerifiedGuard implements CanActivate {
  constructor(private flow: PasswordRecoveryFlowService, private router: Router) {}
  canActivate(): boolean | UrlTree {
    if (this.flow.isEmailSent() && this.flow.isCodeVerified()) return true;
    if (this.flow.isEmailSent()) return this.router.parseUrl('/recuperar-email');
    return this.router.parseUrl('/verificar-email');
  }
}
