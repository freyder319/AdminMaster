import { Component, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TurnosService, TurnoActivoItem } from '../../services/turnos.service';
import { catchError } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

@Component({
  selector: 'app-turnos-activos',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './activos.component.html',
  styleUrls: ['./activos.component.scss']
})
export class ActivosComponent implements OnDestroy {
  activos: TurnoActivoItem[] = [];
  cargando = false;
  private sub?: Subscription;
  modalAbierto = false;
  seleccionado: TurnoActivoItem | null = null;
  private closing = false;
  q = '';
  from = '';
  to = '';

  constructor(private turnos: TurnosService) {
    this.cargar();
  }

  ngOnDestroy(): void {
    try { this.sub?.unsubscribe(); } catch {}
  }

  private cargar() {
    this.cargando = true;
    this.sub = this.turnos.getTurnosActivosPublic()
      .pipe(catchError(() => of([] as TurnoActivoItem[])))
      .subscribe((items) => {
        try {
          const sample = (items || []).slice(0, 3);
          if (sample.length) {
            console.log('[Turnos Activos] Muestra de items:', sample);
            console.log('[Turnos Activos] Claves del primer item:', Object.keys(sample[0] || {}));
          }
        } catch {}
        this.activos = items || [];
        this.cargando = false;
      });
  }

  abrirDetalle(item: TurnoActivoItem) {
    if (this.closing) { return; }
    this.seleccionado = item;
    this.modalAbierto = true;
  }

  cerrarDetalle(ev?: Event) {
    try { ev?.preventDefault(); (ev as any)?.stopImmediatePropagation?.(); ev?.stopPropagation(); } catch {}
    this.closing = true;
    try { console.log('[Activos] cerrarDetalle() called'); } catch {}
    setTimeout(() => {
      try { console.log('[Activos] modalAbierto=false'); } catch {}
      this.modalAbierto = false;
      this.seleccionado = null;
      this.closing = false;
    }, 50);
  }

  get view(): TurnoActivoItem[] {
    const q = (this.q || '').toLowerCase().trim();
    const from = this.from ? new Date(this.from + 'T00:00:00') : null;
    const to = this.to ? new Date(this.to + 'T23:59:59') : null;
    return (this.activos || []).filter(it => {
      const name = (((it as any)?.fullName || (it as any)?.nombreCompleto) || ((((it as any)?.nombres || (it as any)?.nombre || '') + ' ' + ((it as any)?.apellidos || (it as any)?.apellido || '')).trim()) || (it as any)?.correo || ('Usuario ' + ((it as any)?.usuarioId || ''))).toString().toLowerCase();
      if (q && !name.includes(q)) return false;
      const dtRaw = (it as any)?.resumen?.turno?.inicioTurno || (it as any)?.resumen?.turno?.finTurno;
      const dt = dtRaw ? new Date(dtRaw) : null;
      if (from && dt && dt < from) return false;
      if (to && dt && dt > to) return false;
      return true;
    });
  }
}
