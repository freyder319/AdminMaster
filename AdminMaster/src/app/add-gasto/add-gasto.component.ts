import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaService, Categorias } from '../services/categoria.service';
import { ProveedorService, Proveedor } from '../services/proveedor.service';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { GastoService } from '../services/gasto.service';
declare const bootstrap: any;

@Component({
  selector: 'app-add-gasto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-gasto.component.html',
  styleUrls: ['./add-gasto.component.scss']
})
export class AddGastoComponent implements OnInit {
  categorias: Categorias[] = [];
  proveedores: Proveedor[] = [];
  estadoSeleccionado: 'confirmado' | 'pendiente' = 'confirmado';

  // Modelo del formulario
  nombreGasto: string = '';
  fechaGasto: string = '';
  montoGasto: string = '';
  descripcionGasto: string = '';
  categoriaId?: number;
  proveedorId?: number;
  formaPago?: 'efectivo' | 'transferencia' | 'tarjeta' | 'nequi' | 'daviplata' | 'otros';
  submitting = false;
  transaccionId: string = '';

  constructor(
    private categoriaService: CategoriaService,
    private proveedorService: ProveedorService,
    private http: HttpClient,
    private gastoService: GastoService,
  ) {}

  ngOnInit(): void {
    this.categoriaService.getCategories().subscribe((cats) => (this.categorias = cats));
    this.proveedorService.fetchAll().subscribe((list) => (this.proveedores = list));

    const el = document.getElementById('gasto');
    if (el && typeof (window as any)?.bootstrap !== 'undefined') {
      el.addEventListener('shown.bs.offcanvas', () => {
        // siempre dejar "confirmado" seleccionado al abrir
        this.estadoSeleccionado = 'confirmado';

        let input = el.querySelector('input[data-autofocus="true"]') as HTMLInputElement | null;
        if (!input) {
          input = el.querySelector('input') as HTMLInputElement | null;
        }
        if (input) {
          setTimeout(() => {
            input.focus();
            (input as any)?.select?.();
          }, 50);
        }
      });
    }
  }

  setEstado(estado: 'confirmado' | 'pendiente') {
    this.estadoSeleccionado = estado;
  }

  isEstado(estado: 'confirmado' | 'pendiente') {
    return this.estadoSeleccionado === estado;
  }

  onSubmit() {
    const issues = this.validate();
    if (issues.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Completa el Formulario',
        html: `<ul style="text-align:left;margin:0;padding-left:18px;">${issues.map(i => `<li>${i}</li>`).join('')}</ul>`
      });
      return;
    }
    this.submitting = true;
    const usuarioIdStr = localStorage.getItem('userId');
    const usuarioId = usuarioIdStr ? Number(usuarioIdStr) : undefined;
    const payload: any = {
      fecha: this.fechaGasto,
      monto: Number(this.montoGasto).toFixed(2),
      nombre: this.nombreGasto || undefined,
      descripcion: this.descripcionGasto || undefined,
      categoriaId: this.categoriaId ? Number(this.categoriaId) : undefined,
      proveedorId: this.proveedorId ? Number(this.proveedorId) : undefined,
      forma_pago: this.formaPago,
      usuarioId,
      estado: this.estadoSeleccionado,
      transaccionId: this.formaPago && this.formaPago !== 'efectivo' ? (this.transaccionId || undefined) : undefined,
    };
    this.gastoService.create(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        console.log('Gasto Creado, id:', res?.id, 'usuarioId enviado:', usuarioId);
        this.closeGastoOffcanvas();
        Swal.fire({
          icon: 'success',
          title: 'Gasto Registrado!',
          html: `El <b>Gasto</b> fue Registrado con Éxito`,
          timer: 2000,
          showConfirmButton: false
        });
        // TODO: resetear form si deseas
      },
      error: (err) => {
        this.submitting = false;
        console.error('Error creando gasto', err);
        const beMsg = (err?.error?.message && Array.isArray(err.error.message))
          ? `<ul style="text-align:left;margin:0;padding-left:18px;">${err.error.message.map((m: string) => `<li>${m}</li>`).join('')}</ul>`
          : (typeof err?.error?.message === 'string' ? err.error.message : 'Ocurrió un error inesperado');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          html: beMsg
        });
      }
    });
  }

  private validate(): string[] {
    const issues: string[] = [];
    if (!this.nombreGasto?.trim() && !this.descripcionGasto?.trim()) {
      issues.push('Ingresa el nombre o la descripción del gasto.');
    }
    if (!this.fechaGasto) {
      issues.push('Selecciona la fecha y la hora del gasto.');
    }
    if (!this.montoGasto || isNaN(Number(this.montoGasto)) || Number(this.montoGasto) <= 0) {
      issues.push('Ingresa un monto válido mayor a 0.');
    }
    if (!this.formaPago) {
      issues.push('Selecciona una forma de pago.');
    }
    return issues;
  }

  private closeGastoOffcanvas() {
    const el = document.getElementById('gasto');
    if (!el) return;
    try {
      const instance = bootstrap?.Offcanvas?.getInstance(el) || new bootstrap.Offcanvas(el);
      instance?.hide();
    } catch {
      // Fallback: disparar el botón close si existe
      const btn = el.querySelector('.btn-close') as HTMLElement | null;
      btn?.click();
    }
  }

  onEnterFocus(next: any, event: Event, value?: any) {
    event.preventDefault();

    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === 'string' && !value.trim()) {
      return;
    }
    if (typeof value === 'number' && (!Number.isFinite(value) || value <= 0)) {
      return;
    }

    if (next && typeof next.focus === 'function') {
      next.focus();
      if (typeof next.select === 'function') {
        next.select();
      }
    }
  }
}
