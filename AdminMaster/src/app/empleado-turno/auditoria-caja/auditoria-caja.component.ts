import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditoriaCajaService, AuditoriaCaja } from '../../services/auditoria-caja.service';
import { CajasService, Cajas } from '../../services/cajas.service';
import { EmpleadosService, Empleados } from '../../services/empleados.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AgenteIAComponent } from "../../agente-ia/agente-ia.component";

@Component({
  selector: 'app-auditoria-caja',
  standalone: true,
  imports: [CommonModule, FormsModule, AgenteIAComponent],
  templateUrl: './auditoria-caja.component.html',
  styleUrls: ['./auditoria-caja.component.scss']
})
export class AuditoriaCajaComponent {
  registros: AuditoriaCaja[] = [];
  cargando = false;
  q = '';
  from = '';
  to = '';
  dateError = false;
  cajaId: number | '' = '';
  usuarioId: number | '' = '';
  seleccionado: AuditoriaCaja | null = null;
  modalAbierto = false;
  cajas: Cajas[] = [];
  empleados: Empleados[] = [];

  constructor(
    private auditoriaService: AuditoriaCajaService,
    private cajasService: CajasService,
    private empleadosService: EmpleadosService,
  ) {
    this.cargarListas();
    this.cargar();
  }

  validateDates(): void {
    if (this.from && this.to && new Date(this.from) > new Date(this.to)) {
      this.dateError = true;
      this.to = this.from; // Reset to the from date
    } else {
      this.dateError = false;
      // Reload data when dates change
      this.cargar();
    }
  }

  private cargar() {
    this.cargando = true;
    this.auditoriaService
      .list({
        from: this.from || undefined,
        to: this.to || undefined,
        cajaId: this.cajaId ? Number(this.cajaId) : undefined,
        usuarioId: this.usuarioId ? Number(this.usuarioId) : undefined,
      })
      .pipe(catchError(() => of([] as AuditoriaCaja[])))
      .subscribe((items) => {
        this.registros = items || [];
        this.cargando = false;
      });
  }

  private cargarListas() {
    try {
      this.cajasService.getCajas().pipe(catchError(() => of([] as Cajas[]))).subscribe(data => {
        this.cajas = data || [];
      });
    } catch {}

    try {
      this.empleadosService.getEmpleados().pipe(catchError(() => of([] as Empleados[]))).subscribe(data => {
        this.empleados = data || [];
      });
    } catch {}
  }

  aplicarFiltros() {
    this.cargar();
  }

  abrirDetalle(item: AuditoriaCaja) {
    this.seleccionado = item;
    this.modalAbierto = true;
  }

  cerrarDetalle(ev?: Event) {
    try { ev?.preventDefault(); ev?.stopPropagation(); } catch {}
    this.modalAbierto = false;
    this.seleccionado = null;
  }

  get view(): AuditoriaCaja[] {
    const q = (this.q || '').toLowerCase().trim();
    const from = this.from ? new Date(this.from + 'T00:00:00') : null;
    const to = this.to ? new Date(this.to + 'T23:59:59') : null;
    return (this.registros || []).filter((it) => {
      const nombre = `Turno ${it.turnoId}`;
      const name = nombre.toLowerCase();
      if (q && !name.includes(q)) return false;
      const dtRaw = it.fechaHoraCierre;
      const dt = dtRaw ? new Date(dtRaw) : null;
      if (from && dt && dt < from) return false;
      if (to && dt && dt > to) return false;
      return true;
    });
  }

  nombreCaja(id: number | null): string {
    if (!id) return 'N/D';
    const c = (this.cajas || []).find(x => (x as any).id === id);
    if (!c) return `Caja ${id}`;
    const nombre = (c as any).nombre || (c as any).nombreCaja || (c as any).descripcion;
    return nombre || `Caja ${id}`;
  }

  nombreUsuario(id: number | null): string {
    if (!id) return 'N/D';
    const e = (this.empleados || []).find(x => (x as any).id === id);
    if (!e) return `Usuario ${id}`;
    const nombre = (e as any).nombre || (e as any).nombres || '';
    const apellido = (e as any).apellido || (e as any).apellidos || '';
    const full = `${nombre} ${apellido}`.trim();
    return full || nombre || `Usuario ${id}`;
  }

  openDatePicker(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.type === 'date') {
      // Remover readonly temporalmente para permitir la interacción
      input.removeAttribute('readonly');
      // Hacer foco y mostrar el picker
      input.focus();
      input.showPicker?.();
      // Restaurar readonly después de un pequeño delay
      setTimeout(() => {
        input.setAttribute('readonly', 'true');
      }, 100);
    }
  }
}
