import { Injectable } from '@angular/core';

export interface RecoveryState {
  email?: string;
  emailSent: boolean;
  codeVerified: boolean;
  sentAt?: number;
}

@Injectable({ providedIn: 'root' })
export class PasswordRecoveryFlowService {
  private readonly KEY = 'recovery_flow_state';
  private state: RecoveryState = { emailSent: false, codeVerified: false };
  private readonly EXPIRE_MS = 5 * 60 * 1000; // 5 minutos

  constructor() {
    this.hydrate();
  }

  private hydrate() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) this.state = { ...this.state, ...JSON.parse(raw) };
    } catch {}
  }

  private persist() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.state)); } catch {}
  }

  resetAll() {
    this.state = { emailSent: false, codeVerified: false, email: undefined, sentAt: undefined };
    try { localStorage.removeItem(this.KEY); } catch {}
  }

  setEmailSent(email: string) {
    this.state.email = email;
    this.state.emailSent = true;
    this.state.codeVerified = false;
    this.state.sentAt = Date.now();
    this.persist();
  }

  setCodeVerified() {
    if (this.state.emailSent) {
      this.state.codeVerified = true;
      this.persist();
    }
  }

  getEmail(): string | undefined { return this.state.email; }
  isEmailSent(): boolean { return !!this.state.emailSent && !!this.state.email; }
  isCodeVerified(): boolean { return !!this.state.codeVerified; }

  isExpired(): boolean {
    if (!this.state.sentAt) return true;
    return Date.now() - this.state.sentAt > this.EXPIRE_MS;
  }

  remainingSeconds(): number {
    if (!this.state.sentAt) return 0;
    const left = this.EXPIRE_MS - (Date.now() - this.state.sentAt);
    return Math.max(0, Math.ceil(left / 1000));
  }
}
