import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TurnoActivoState {
  inicioTurno: string;
  observaciones?: string | null;
  usuarioId: number;
}

@Injectable({ providedIn: 'root' })
export class TurnoStateService {
  private readonly STORAGE_KEY = 'turno_activo_state';
  private readonly _turno$ = new BehaviorSubject<TurnoActivoState | null>(null);
  turnoActivo$ = this._turno$.asObservable();

  hydrateFromStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) this._turno$.next(JSON.parse(raw));
    } catch {}
  }

  setActivo(state: TurnoActivoState) {
    this._turno$.next(state);
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  clear() {
    this._turno$.next(null);
    try { localStorage.removeItem(this.STORAGE_KEY); } catch {}
  }

  get snapshot() { return this._turno$.value; }
}
