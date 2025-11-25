import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
declare const bootstrap: any;
import { AuthService } from '../services/auth.service';
import { VentaLibreService } from '../services/venta-libre.service';

@Component({
  selector: 'app-add-venta-libre',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './add-venta-libre.component.html',
  styleUrls: ['./add-venta-libre.component.scss']
})
export class AddVentaLibreComponent implements OnInit {
  // Estado del formulario
  nombreVenta: string = '';
  estadoVenta: 'confirmada' | 'pendiente' = 'confirmada';
  fechaHora: string = '';
  formaPago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'otros';
  observaciones: string = '';
  tipo_venta: 'libre' = 'libre';
  turno_id?: number | null = null; // null si admin

  productos: Array<{ nombre: string; cantidad: number; precio: number; subtotal: number }>= [
    { nombre: '', cantidad: 1, precio: 0, subtotal: 0 }
  ];
  total: number = 0;
  submitting = false;
  transaccionId: string = '';

  private toPesos(n: any): number {
    const num = Number(n);
    return Number.isFinite(num) ? Math.round(num) : 0;
  }

  constructor(private auth: AuthService, private ventaLibreSrv: VentaLibreService) {}

  get isPuntoPos(): boolean {
    return (this.auth.getRole() === 'punto_pos');
  }

  ngOnInit(): void {
    if (this.isPuntoPos) {
      try {
        const raw = localStorage.getItem('cajaId');
        const parsed = raw !== null ? Number(raw) : NaN;
        this.turno_id = Number.isFinite(parsed) ? parsed : null;
      } catch {
        this.turno_id = null;
      }
    } else {
      this.turno_id = null;
    }

    const el = document.getElementById('venta-libre');
    if (el && typeof (window as any)?.bootstrap !== 'undefined') {
      el.addEventListener('shown.bs.offcanvas', () => {
        // siempre dejar "confirmada" seleccionada al abrir
        this.estadoVenta = 'confirmada';

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

  setEstado(tipo: 'confirmada' | 'pendiente') {
    this.estadoVenta = tipo;
  }
  isEstado(tipo: 'confirmada' | 'pendiente') {
    return this.estadoVenta === tipo;
  }

  addProducto() {
    this.productos.push({ nombre: '', cantidad: 1, precio: 0, subtotal: 0 });
  }

  removeProducto(i: number) {
    this.productos.splice(i, 1);
    this.recalcTotal();
  }

  updateSubtotal(i: number) {
    const p = this.productos[i];
    const cant = Number(p.cantidad) || 0;
    const prec = this.toPesos(p.precio) || 0;
    p.precio = prec;
    p.subtotal = this.toPesos(cant * prec);
    this.recalcTotal();
  }

  private recalcTotal() {
    this.total = this.toPesos(
      this.productos.reduce((acc, p) => acc + (this.toPesos(p.subtotal) || 0), 0)
    );
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
    const usuario_id = usuarioIdStr ? Number(usuarioIdStr) : undefined;

    const payload = {
      nombre: this.nombreVenta,
      estado: this.estadoVenta,
      fecha_hora: this.fechaHora || undefined,
      productos: this.productos.map(p => ({ nombre: p.nombre, cantidad: p.cantidad, precio: this.toPesos(p.precio), subtotal: this.toPesos(p.subtotal) })),
      total: this.total.toFixed(0),
      forma_pago: this.formaPago,
      usuario_id,
      observaciones: this.observaciones || undefined,
      tipo_venta: this.tipo_venta,
      turno_id: this.isPuntoPos ? (this.turno_id ?? undefined) : undefined,
      transaccionId: this.formaPago && this.formaPago !== 'efectivo' ? (this.transaccionId || undefined) : undefined,
    };

    this.ventaLibreSrv.create(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        this.closeOffcanvas();
        Swal.fire({
          icon: 'success',
          title: 'Venta Registrada!',
          html: 'La <b>Venta Libre</b> fue Registrada con Éxito',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        this.submitting = false;
        const beMsg = Array.isArray(err?.error?.message)
          ? `<ul style="text-align:left;margin:0;padding-left:18px;">${err.error.message.map((m: string) => `<li>${m}</li>`).join('')}</ul>`
          : (typeof err?.error?.message === 'string' ? err.error.message : 'Ocurrió un error inesperado');
        Swal.fire({ icon: 'error', title: 'Error', html: beMsg });
      }
    });
  }

  private validate(): string[] {
    const issues: string[] = [];
    if (!this.nombreVenta?.trim()) issues.push('Ingresa el nombre de la venta.');
    if (!this.formaPago) issues.push('Selecciona la forma de pago.');
    // Productos: al menos uno con cantidad>0 y precio>0 y nombre
    const productosValidos = this.productos.filter(p => p.nombre?.trim() && Number(p.cantidad) > 0 && Number(p.precio) > 0);
    if (productosValidos.length === 0) issues.push('Agrega al menos un producto válido (nombre, cantidad y precio).');
    if (this.total <= 0) issues.push('El total debe ser mayor a 0.');
    // Total tope similar a numeric(12,2)
    if (this.total >= 1e10) issues.push('El total supera el máximo permitido (9,999,999,999.99).');
    return issues;
  }

  private closeOffcanvas() {
    const el = document.getElementById('venta-libre');
    if (!el) return;
    try {
      const instance = bootstrap?.Offcanvas?.getInstance(el) || new bootstrap.Offcanvas(el);
      instance?.hide();
    } catch {
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
