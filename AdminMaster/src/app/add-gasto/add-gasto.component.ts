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
  estadoSeleccionado: 'confirmado' | 'pendiente' | 'anulado' = 'pendiente';

  // Modelo del formulario
  nombreGasto: string = '';
  fechaGasto: string = '';
  montoGasto: string = '';
  descripcionGasto: string = '';
  categoriaId?: number;
  proveedorId?: number;
  formaPago?: 'efectivo' | 'transferencia' | 'tarjeta' | 'nequi' | 'daviplata' | 'otros';
  submitting = false;

  constructor(
    private categoriaService: CategoriaService,
    private proveedorService: ProveedorService,
    private http: HttpClient,
    private gastoService: GastoService,
  ) {}

  ngOnInit(): void {
    this.categoriaService.getCategories().subscribe((cats) => (this.categorias = cats));
    this.proveedorService.fetchAll().subscribe((list) => (this.proveedores = list));
  }

  setEstado(estado: 'confirmado' | 'pendiente' | 'anulado') {
    this.estadoSeleccionado = estado;
  }

  isEstado(estado: 'confirmado' | 'pendiente' | 'anulado') {
    return this.estadoSeleccionado === estado;
  }

  onSubmit() {
    const issues = this.validate();
    if (issues.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Completa el formulario',
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
    };
    this.gastoService.create(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        console.log('Gasto creado, id:', res?.id, 'usuarioId enviado:', usuarioId);
        this.closeGastoOffcanvas();
        Swal.fire({
          icon: 'success',
          title: 'Gasto creado',
          text: `ID: ${res?.id}`,
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
          : (typeof err?.error?.message === 'string' ? err.error.message : 'No se pudo crear el gasto');
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
      issues.push('Selecciona la fecha del gasto.');
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
}
