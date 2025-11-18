import { Component, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TurnosService, TurnoActivoItem } from '../../services/turnos.service';
import { catchError } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

@Component({
  selector: 'app-turnos-cerrados',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterModule],
  templateUrl: './cerrados.component.html',
  styleUrls: ['./cerrados.component.scss']
})
export class CerradosComponent implements OnDestroy {
  cerrados: TurnoActivoItem[] = [];
  cargando = false;
  private sub?: Subscription;
  modalAbierto = false;
  seleccionado: TurnoActivoItem | null = null;
  private closing = false;
  q = '';
  from = '';
  to = '';

  constructor(private turnos: TurnosService, private router: Router) {
    this.cargar();
  }

  ngOnDestroy(): void {
    try { this.sub?.unsubscribe(); } catch {}
  }

  private cargar() {
    this.cargando = true;
    this.sub = this.turnos.getTurnosCerradosPublic()
      .pipe(catchError(() => of([] as TurnoActivoItem[])))
      .subscribe((items) => {
        try {
          const sample = (items || []).slice(0, 3);
          if (sample.length) {
            console.log('[Turnos Cerrados] Muestra de items:', sample);
            console.log('[Turnos Cerrados] Claves del primer item:', Object.keys(sample[0] || {}));
          }
        } catch {}
        this.cerrados = items || [];
        this.cargando = false;
      });
  }

  abrirDetalle(item: TurnoActivoItem) {
    // modal desactivado
    return;
  }

  cerrarDetalle(ev?: Event) {
    try { ev?.preventDefault(); (ev as any)?.stopImmediatePropagation?.(); ev?.stopPropagation(); } catch {}
    this.closing = true;
    setTimeout(() => {
      this.modalAbierto = false;
      this.seleccionado = null;
      this.closing = false;
    }, 50);
  }

  verMasDetalle(ev?: Event) {
    if (ev) { try { ev.preventDefault(); ev.stopPropagation(); } catch {} }
    const payload = this.seleccionado;
    if (!payload) return;
    try {
      console.log('[VerMás] Navegando a detalle-turno-cerrado con payload:', payload);
      this.router.navigateByUrl('/detalle-turno-cerrado', { state: { turno: payload } })
        .then(ok => {
          if (ok) this.modalAbierto = false;
        })
        .catch(e => console.error('[VerMás] Error al navegar:', e));
    } catch (e) {
      console.error('[VerMás] Error al navegar:', e);
    }
  }

  get view(): TurnoActivoItem[] {
    const q = (this.q || '').toLowerCase().trim();
    const from = this.from ? new Date(this.from + 'T00:00:00') : null;
    const to = this.to ? new Date(this.to + 'T23:59:59') : null;
    return (this.cerrados || []).filter(it => {
      const name = (((it as any)?.fullName || (it as any)?.nombreCompleto) || ((((it as any)?.nombres || (it as any)?.nombre || '') + ' ' + ((it as any)?.apellidos || (it as any)?.apellido || '')).trim()) || (it as any)?.correo || ('Usuario ' + ((it as any)?.usuarioId || ''))).toString().toLowerCase();
      if (q && !name.includes(q)) return false;
      const dtRaw = (it as any)?.resumen?.turno?.inicioTurno || (it as any)?.resumen?.turno?.finTurno;
      const dt = dtRaw ? new Date(dtRaw) : null;
      if (from && dt && dt < from) return false;
      if (to && dt && dt > to) return false;
      return true;
    });
  }

  duracionTurno(item: TurnoActivoItem | null | undefined): string {
    try {
      const ini = (item as any)?.resumen?.turno?.inicioTurno ? new Date((item as any).resumen.turno.inicioTurno) : null;
      const fin = (item as any)?.resumen?.turno?.finTurno ? new Date((item as any).resumen.turno.finTurno) : null;
      if (!ini || !fin) return '—';
      const diff = fin.getTime() - ini.getTime();
      if (diff < 0) return '—';
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      return `${h}h ${m}m`;
    } catch { return '—'; }
  }

  resumenMetodosPago(item: TurnoActivoItem | null | undefined): Array<{ forma: string; total: number; cantidad: number }> {
    const res: Record<string, { total: number; cantidad: number }> = {};
    const gastos = (item as any)?.resumen?.actividad?.gastos as Array<any> | undefined;
    if (!Array.isArray(gastos)) return [];
    for (const g of gastos) {
      const f = (g?.forma_pago || '').toString().trim();
      if (!f) continue;
      if (!res[f]) res[f] = { total: 0, cantidad: 0 };
      res[f].total += Number(g?.monto || 0);
      res[f].cantidad += 1;
    }
    return Object.entries(res).map(([forma, v]) => ({ forma, total: v.total, cantidad: v.cantidad }));
  }
}
