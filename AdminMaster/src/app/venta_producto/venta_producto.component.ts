import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Producto, ProductoService } from '../services/producto.service';
import { VentaService, CreateVentaPayload } from '../services/venta.service';
import Swal from 'sweetalert2';
declare const bootstrap: any;

@Component({
  selector: 'app_venta_producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './venta_producto.component.html',
  styleUrl: './venta_producto.component.scss'
})
export class VentaProductoComponent {
  productos: Producto[] = [];
  private baseImageUrl = 'http://localhost:3000/storage/';
  private storageKey = 'venta_cart';
  searchTerm: string = '';
  sortOption: 'masVendidos' | 'alfabetico' | 'masRentables' | 'ultimasUnidades' = 'masVendidos';
  cart: { producto: Producto; cantidad: number; subtotal: number }[] = [];
  amountReceived: number | null = null;
  formaPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'otros' = 'efectivo';
  isSubmitting = false;

  private toPesos(n: any): number {
    const num = Number(n);
    return Number.isFinite(num) ? Math.round(num) : 0;
  }

  get cartCount(): number {
    return this.cart.reduce((acc, it) => acc + it.cantidad, 0);
  }

  openConfirmModal(): void {
    // Prellenar con el total para facilitar
    this.amountReceived = this.cartTotal;
    // Si estamos en móvil y el offcanvas está abierto, cerrarlo antes de abrir el modal
    try {
      const el = document.getElementById('offcanvasCart');
      if (el) {
        const inst = bootstrap?.Offcanvas?.getInstance(el) || new bootstrap.Offcanvas(el);
        inst?.hide?.();
      }
    } catch {}
  }

  confirmSale(): void {
    if (!this.canPay) return;
    // Validaciones básicas
    if (this.cart.length === 0) return;
    // Construir payload para Nueva Venta (no venta libre)
    const items = this.cart
      .filter(ci => typeof ci.producto.id === 'number')
      .map(ci => {
        const unitPrice = Number(ci.producto.precioComercial ?? ci.producto.precioUnitario);
        const precio = this.toPesos(Number.isFinite(unitPrice) ? unitPrice : 0);
        const subtotal = this.toPesos(Number(ci.cantidad) * precio);
        return {
          productoId: Number(ci.producto.id),
          cantidad: Number(ci.cantidad),
          precio,
          subtotal,
        };
      });
    const missing = this.cart.length - items.length;
    if (missing > 0) {
      try {
        Swal.fire({
          icon: 'warning',
          title: 'Productos omitidos',
          text: 'Algunos productos no tienen id y no serán incluidos en la venta.'
        });
      } catch {}
    }
    const invalid = items.filter(it => !(it.precio > 0) || !(it.cantidad > 0));
    if (invalid.length > 0) {
      try {
        Swal.fire({
          icon: 'error',
          title: 'Datos inválidos',
          text: 'Hay productos con precio o cantidad inválidos. Verifica los precios y vuelve a intentar.'
        });
      } catch {}
      return;
    }
    const computedTotal = this.toPesos(items.reduce((sum, it) => sum + it.subtotal, 0));
    const payload: CreateVentaPayload = {
      total: computedTotal,
      forma_pago: this.formaPago,
      items,
    };
    try {
      const uid = localStorage.getItem('userId');
      const parsed = uid ? Number(uid) : NaN;
      if (!Number.isNaN(parsed)) {
        (payload as any).usuario_id = parsed;
      }
      const rol = (localStorage.getItem('rol') || '').trim().toLowerCase();
      if (rol === 'admin') {
        (payload as any).turno_id = null;
      }
    } catch {}
    if (items.length === 0) return; // nada válido para enviar

    this.isSubmitting = true;
    console.log('Enviando venta payload:', JSON.parse(JSON.stringify(payload)));
    try { if ((payload as any)?.items) { console.table((payload as any).items); } } catch {}
    this.ventaService.create(payload).subscribe({
      next: () => {
        this.cart = [];
        this.saveCart();
        this.amountReceived = null;
        this.isSubmitting = false;
        try {
          Swal.fire({
            icon: 'success',
            title: 'Venta registrada',
            html: `Total: <b>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(payload.total)}</b><br>` +
                  `Cambio: <b>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(this.change)}</b>`
          }).then(() => {
            // Refrescar solo los productos y resetear filtros básicos
            this.loadProductos();
            try { this.searchTerm = ''; } catch {}
          });
        } catch {}
      },
      error: (err) => {
        // Mantener estado para que el usuario pueda reintentar
        this.isSubmitting = false;
        console.group('Error al registrar venta');
        console.error('Status:', err?.status);
        console.error('StatusText:', err?.statusText);
        console.error('URL:', err?.url);
        console.error('Response body:', err?.error);
        const msg = (err?.error?.message) ? (Array.isArray(err.error.message) ? err.error.message : [String(err.error.message)]) : ['No se pudo registrar la venta.'];
        msg.forEach((m: string) => console.error('Mensaje:', m));
        console.groupEnd();
        try {
          Swal.fire({
            icon: 'error',
            title: 'No se pudo registrar la venta',
            html: msg.map((m: string) => `<div>${m}</div>`).join('')
          });
        } catch {}
      }
    });
  }
  get cartTotal(): number {
    const sum = this.cart.reduce((acc, it) => acc + this.toPesos(it.subtotal), 0);
    return this.toPesos(sum);
  }

  get canPay(): boolean {
    return this.toPesos(this.amountReceived ?? 0) >= this.cartTotal && this.cartTotal > 0;
  }

  get change(): number {
    const recibido = this.toPesos(this.amountReceived ?? 0);
    const r = recibido - this.cartTotal;
    return r > 0 ? this.toPesos(r) : 0;
  }

  get sortLabel(): string {
    switch (this.sortOption) {
      case 'alfabetico': return 'Alfabéticamente';
      case 'masRentables': return 'Productos Más Rentables';
      case 'ultimasUnidades': return 'Últimas Unidades Disponibles';
      default: return 'Productos más Vendidos';
    }
  }

  addToCart(p: Producto): void {
    if ((p.stockProducto ?? 0) <= 0) return;
    const price = this.toPesos((p.precioComercial ?? p.precioUnitario) || 0);
    const key = (p.id ?? p.codigoProducto);
    const found = this.cart.find(ci => (ci.producto.id ?? ci.producto.codigoProducto) === key);
    if (found) {
      if (found.cantidad < (p.stockProducto ?? 0)) {
        found.cantidad += 1;
        found.subtotal = this.toPesos(found.cantidad * price);
      }
    } else {
      this.cart.push({ producto: p, cantidad: 1, subtotal: this.toPesos(price) });
    }
    this.saveCart();
  }

  increment(item: { producto: Producto; cantidad: number; subtotal: number }): void {
    const p = item.producto;
    const price = this.toPesos((p.precioComercial ?? p.precioUnitario) || 0);
    if (item.cantidad < (p.stockProducto ?? 0)) {
      item.cantidad += 1;
      item.subtotal = this.toPesos(item.cantidad * price);
      this.saveCart();
    }
  }

  decrement(item: { producto: Producto; cantidad: number; subtotal: number }): void {
    const p = item.producto;
    const price = this.toPesos((p.precioComercial ?? p.precioUnitario) || 0);
    if (item.cantidad > 1) {
      item.cantidad -= 1;
      item.subtotal = this.toPesos(item.cantidad * price);
      this.saveCart();
    } else {
      this.remove(item);
    }
  }

  remove(item: { producto: Producto; cantidad: number; subtotal: number }): void {
    const key = (item.producto.id ?? item.producto.codigoProducto);
    this.cart = this.cart.filter(ci => (ci.producto.id ?? ci.producto.codigoProducto) !== key);
    this.saveCart();
  }

  private saveCart(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
    } catch {}
  }

  private loadCart(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.cart = parsed.map((it: any) => {
          const p: Producto = it.producto || {};
          const cantidad = Number(it.cantidad) || 0;
          const price = this.toPesos((p?.precioComercial ?? p?.precioUnitario) || 0);
          return { producto: p, cantidad, subtotal: this.toPesos(cantidad * price) };
        });
      }
    } catch {}
  }

  get productosFiltrados(): Producto[] {
    const q = (this.searchTerm || '').trim().toLowerCase();
    if (!q) return this.productos;
    return this.productos.filter(p =>
      String(p.nombreProducto || '').toLowerCase().includes(q) ||
      String(p.codigoProducto || '').toLowerCase().includes(q)
    );
  }

  get productosOrdenados(): Producto[] {
    const list = [...this.productosFiltrados];
    if (this.sortOption === 'alfabetico') {
      return list.sort((a,b) => String(a.nombreProducto||'').localeCompare(String(b.nombreProducto||'')));
    }
    if (this.sortOption === 'masRentables') {
      return list.sort((a,b) => ((b.precioComercial ?? b.precioUnitario) - (a.precioComercial ?? a.precioUnitario)));
    }
    if (this.sortOption === 'ultimasUnidades') {
      return list.sort((a,b) => (a.stockProducto - b.stockProducto));
    }
    return list;
  }

  constructor(private productoService: ProductoService, private ventaService: VentaService) {}

  ngOnInit(): void {
    this.loadCart();
    this.loadProductos();
  }

  private loadProductos(): void {
    this.productoService.getAll().subscribe({
      next: (data) => (this.productos = data || []),
      error: () => (this.productos = [])
    });
  }

  toImageUrl(img?: string | null): string {
    if (!img) return this.baseImageUrl + 'default.jpg';
    const s = String(img).trim();
    if (s === '') return this.baseImageUrl + 'default.jpg';
    if (s.toLowerCase().startsWith('default') && s.toLowerCase() !== 'default.jpg') {
      return this.baseImageUrl + 'default.jpg';
    }
    if (s.startsWith('http') || s.startsWith('data:')) return s;
    return this.baseImageUrl + s.replace(/^\/+/, '');
  }
}
