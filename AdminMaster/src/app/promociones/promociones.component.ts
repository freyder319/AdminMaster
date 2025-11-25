import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DescuentoService, Descuento, CreateDescuento } from '../services/descuento.service';
import Swal from 'sweetalert2';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";

@Component({
  selector: 'app-promociones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AdminNavbarComponent],
  templateUrl: './promociones.component.html',
  styleUrls: ['./promociones.component.scss']
})
export class PromocionesComponent implements OnInit {
  form: FormGroup;
  promociones: Descuento[] = [];
  searchTerm: string = '';

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

  ngOnInit(): void {
    this.descuentoService.items$.subscribe((list: Descuento[]) => (this.promociones = list));
    this.descuentoService.fetchAll().subscribe();
  }

  get promocionesFiltradas(): Descuento[] {
    const t = (this.searchTerm || '').trim().toLowerCase();
    if (!t) return this.promociones;
    return this.promociones.filter(p => {
      const nombre = (p.nombre || '').toLowerCase();
      const tipo = (p.tipo || '').toString().toLowerCase();
      const porc = String(p.porcentaje ?? '').toLowerCase();
      const activo = p.activo ? 'activa' : 'inactiva';
      return (
        nombre.includes(t) ||
        tipo.includes(t) ||
        porc.includes(t) ||
        activo.includes(t)
      );
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
          html: 'La <b>Promoción</b> se creó correctamente.'
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
            html: 'La <b>Promoción</b> se eliminó correctamente.'
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
            return;
          }

          const fallback = rawMsg || 'Intenta nuevamente.';
          Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: fallback });
        }
      });
    });
  }
}
