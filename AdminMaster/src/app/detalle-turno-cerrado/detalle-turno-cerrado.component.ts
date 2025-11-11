import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";

@Component({
  selector: 'app-detalle-turno-cerrado',
  standalone: true,
  imports: [CommonModule, DatePipe, AdminNavbarComponent],
  templateUrl: './detalle-turno-cerrado.component.html',
  styleUrls: ['./detalle-turno-cerrado.component.scss']
})
export class DetalleTurnoCerradoComponent {
  turno: any = null;

  constructor(private router: Router) {
    try {
      const nav = this.router.getCurrentNavigation();
      this.turno = nav?.extras?.state?.['turno'] || history.state?.['turno'] || null;
    } catch { this.turno = history.state?.['turno'] || null; }
  }

  get montoInicial(): number { return Number(this.turno?.resumen?.aperturaCaja?.montoInicial || 0); }
  get montoFinal(): number { return Number(this.turno?.resumen?.cierreCaja?.montoFinal || 0); }
  get totalVentas(): number { return Number(this.turno?.resumen?.actividad?.totalVentas || 0); }
  get totalVentasLibres(): number { return Number(this.turno?.resumen?.actividad?.totalVentasLibres || 0); }
  get totalGastos(): number { return Number(this.turno?.resumen?.actividad?.totalGastos || 0); }
  get totalNeto(): number { return this.montoInicial + this.totalVentas + this.totalVentasLibres - this.totalGastos; }
  get transaccionesTotal(): number { return Number(this.turno?.resumen?.actividad?.transacciones || 0) + Number(this.turno?.resumen?.actividad?.transaccionesLibres || 0); }

  duracionTurno(): string {
    try {
      const iniRaw = this.turno?.resumen?.turno?.inicioTurno;
      const finRaw = this.turno?.resumen?.turno?.finTurno;
      if (!iniRaw || !finRaw) return '—';
      const ini = new Date(iniRaw), fin = new Date(finRaw);
      const diff = fin.getTime() - ini.getTime();
      if (diff < 0) return '—';
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      return `${h}h ${m}m`;
    } catch { return '—'; }
  }

  resumenMetodosPago(): Array<{ forma: string; total: number; cantidad: number }> {
    const res: Record<string, { total: number; cantidad: number }> = {};
    const gastos = this.turno?.resumen?.actividad?.gastos as Array<any> | undefined;
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

  volver() {
    try { history.back(); }
    catch { this.router.navigate(['/turno-empleado/cerrados']); }
  }
}
