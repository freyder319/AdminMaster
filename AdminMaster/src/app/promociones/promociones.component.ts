import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DescuentoService, Descuento, CreateDescuento } from '../services/descuento.service';
import Swal from 'sweetalert2';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AgenteIAComponent } from "../agente-ia/agente-ia.component";

@Component({
  selector: 'app-promociones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AdminNavbarComponent, AgenteIAComponent],
  templateUrl: './promociones.component.html',
  styleUrls: ['./promociones.component.scss']
})
export class PromocionesComponent implements OnInit {
  form: FormGroup;
  promociones: Descuento[] = [];
  searchTerm: string = '';
  dateFilter: string = '';
  // IDs de promociones que el backend indicó que no se pueden eliminar (por tener ventas)
  nonDeletableIds = new Set<number>();

  constructor(private fb: FormBuilder, private descuentoService: DescuentoService) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      porcentaje: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
      tipo: ['PORCENTAJE'],
      fechaInicio: [null],
      fechaFin: [null],
      activo: [true],
    });
  }

  // === Helpers de estado y borrado ===

  /** Devuelve true si la promo ya venció por fechaFin. */
  isExpired(p: Descuento): boolean {
    return !!p.fechaFin && p.fechaFin < Date.now();
  }

  /** Estado de texto usando activo + vigencia. */
  estadoVisual(p: Descuento): 'Activa' | 'Inactiva' {
    if (this.isExpired(p)) return 'Inactiva';
    return p.activo ? 'Activa' : 'Inactiva';
  }

  /** Clase CSS para el pill de estado (activo/inactivo). */
  claseEstado(p: Descuento): string {
    return this.estadoVisual(p) === 'Activa' ? 'activo' : 'inactivo';
  }

  /** Indica si la promo fue marcada como enlazada a una venta (no eliminable por backend). */
  isLinkedToSale(p: Descuento): boolean {
    return this.nonDeletableIds.has(p.id);
  }

  /** Indica si debe mostrarse el botón Eliminar para esta promo. */
  canDelete(p: Descuento): boolean {
    // No se puede eliminar si el backend ya indicó que no, o si la promo está inactiva/vencida
    if (this.nonDeletableIds.has(p.id)) return false;
    return this.estadoVisual(p) === 'Activa';
  }

  ngOnInit(): void {
    this.descuentoService.items$.subscribe((list: Descuento[]) => (this.promociones = list));
    this.descuentoService.fetchAll().subscribe();
  }

  get promocionesFiltradas(): Descuento[] {
    const t = (this.searchTerm || '').trim().toLowerCase();
    const d = (this.dateFilter || '').trim();

    // Precalcular rango del día seleccionado (si hay filtro de fecha)
    let dayStart: number | null = null;
    let dayEnd: number | null = null;
    if (d) {
      const parsed = new Date(d + 'T00:00:00');
      if (!isNaN(parsed.getTime())) {
        dayStart = parsed.getTime();
        dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1; // fin del día
      }
    }

    return this.promociones.filter(p => {
      // Filtro por texto
      if (t) {
        const nombre = (p.nombre || '').toLowerCase();
        const tipo = (p.tipo || '').toString().toLowerCase();
        const porc = String(p.porcentaje ?? '').toLowerCase();
        const activo = p.activo ? 'activa' : 'inactiva';
        const matchesText =
          nombre.includes(t) ||
          tipo.includes(t) ||
          porc.includes(t) ||
          activo.includes(t);
        if (!matchesText) return false;
      }

      // Filtro por fecha de vigencia
      if (dayStart != null && dayEnd != null) {
        const fi = p.fechaInicio ?? null;
        const ff = p.fechaFin ?? null;

        // Consideramos relacionada si la vigencia intersecta el día seleccionado
        const startsBeforeOrOn = fi == null || fi <= dayEnd;
        const endsAfterOrOn = ff == null || ff >= dayStart;
        const overlaps = startsBeforeOrOn && endsAfterOrOn;

        if (!overlaps) return false;
      }

      return true;
    });
  }

  add() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload: CreateDescuento = {
      nombre: String(v.nombre).trim(),
      porcentaje: Number(v.porcentaje),
      creadoEn: Date.now(),
      tipo: (v.tipo || 'PORCENTAJE') as any,
      fechaInicio: v.fechaInicio ? new Date(v.fechaInicio).getTime() : null,
      fechaFin: v.fechaFin ? new Date(v.fechaFin).getTime() : null,
      activo: !!v.activo,
    };
    this.descuentoService.create(payload).subscribe({
      next: () => {
        this.form.reset();
        Swal.fire({
          icon: 'success',
          title: 'Promoción creada',
          html: 'La <b>Promoción</b> se Creó Correctamente.',
          allowOutsideClick: true
        });
      },
      error: (err: any) => {
        const msg = (err?.error && (err.error.message || err.error.error)) || 'Intenta nuevamente.';
        Swal.fire({ icon: 'error', title: 'No se pudo crear', text: msg });
      }
    });
  }

  remove(id: number) {
    Swal.fire({
      title: '¿Eliminar promoción?',
      text: 'Esta acción NO se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.descuentoService.remove(id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Promoción eliminada',
            html: 'La <b>Promoción</b> se Eliminó Correctamente.'
          });
        },
        error: (err: any) => {
          const rawMsg = (err?.error && (err.error.message || err.error.error)) || '';
          const msg = String(rawMsg || '').toLowerCase();

          if (err?.status === 400 || err?.status === 409 || msg.includes('venta') || msg.includes('relacionado')) {
            Swal.fire({
              icon: 'error',
              title: 'No se puede eliminar',
              html: 'Esta <b>Promoción</b> está vinculada a una venta y <b>NO puede ser eliminada</b>.'
            });
            // Marcar como no eliminable para ocultar el botón en adelante
            this.nonDeletableIds.add(id);
            return;
          }

          const fallback = rawMsg || 'Intenta nuevamente.';
          Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: fallback });
        }
      });
    });
  }
}
