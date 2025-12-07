import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto, ProductoService } from '../services/producto.service';
import { VentaService, CreateVentaPayload } from '../services/venta.service';
import { Clientes, ClientesService } from '../services/clientes.service';
import { DescuentoService, Descuento } from '../services/descuento.service';
import Swal from 'sweetalert2';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { environment } from '../config/environment';
declare const bootstrap: any;

@Component({
  selector: 'app_venta_producto',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  templateUrl: './venta_producto.component.html',
  styleUrl: './venta_producto.component.scss'
})
export class VentaProductoComponent implements AfterViewInit {
  productos: Producto[] = [];
  private baseImageUrl = `${environment.apiUrl}/storage/`;
  private storageKey = 'venta_cart';
  searchTerm: string = '';
  sortOption: 'todos' | 'masVendidos' | 'alfabetico' | 'masRentables' | 'ultimasUnidades' = 'todos';
  // Mostrar también productos inhabilitados en la grilla
  showDisabled: boolean = false;
  cart: { producto: Producto; cantidad: number; subtotal: number }[] = [];
  amountReceived: number | null = null;
  formaPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'otros' = 'efectivo';
  estadoVenta: 'confirmada' | 'pendiente' = 'confirmada';
  transaccionId: string = '';
  isSubmitting = false;
  descuentos: Descuento[] = [];
  selectedDescuentoId: number | null = null;
  // Cliente asociado a la venta
  clientes: Clientes[] = [];
  selectedClienteId: number | null = null;
  clienteSearchTerm: string = '';

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  private toPesos(n: any): number {
    const num = Number(n);
    return Number.isFinite(num) ? Math.round(num) : 0;
  }

  private showDeltaBubble(delta: number, anchorEl?: HTMLElement | null): void {
    try {
      const target: HTMLElement | null = anchorEl || this.getCartTarget();
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const bubble = document.createElement('div');
      bubble.textContent = `${delta > 0 ? '+' : ''}${delta}`;
      bubble.style.position = 'fixed';
      bubble.style.left = `${rect.right - 6}px`;
      bubble.style.top = `${rect.top}px`;
      bubble.style.transform = 'translate(-50%, -50%)';
      bubble.style.padding = '2px 6px';
      bubble.style.borderRadius = '999px';
      bubble.style.fontWeight = '700';
      bubble.style.fontSize = '12px';
      bubble.style.color = '#fff';
      bubble.style.background = delta > 0 ? '#10b981' : '#ef4444';
      bubble.style.zIndex = '10002';
      bubble.style.pointerEvents = 'none';
      bubble.style.opacity = '0.95';
      document.body.appendChild(bubble);
      bubble.animate(
        [
          { transform: 'translate(-50%, -50%) translateY(0)', opacity: 0.95 },
          { transform: 'translate(-50%, -50%) translateY(-18px)', opacity: 0 }
        ],
        { duration: 520, easing: 'ease-out' }
      ).addEventListener('finish', () => { try { bubble.remove(); } catch {} });
    } catch {}
  }

  get cartCount(): number {
    return this.cart.reduce((acc, it) => acc + it.cantidad, 0);
  }

  setEstado(tipo: 'confirmada' | 'pendiente') {
    this.estadoVenta = tipo;
  }

  isEstado(tipo: 'confirmada' | 'pendiente') {
    return this.estadoVenta === tipo;
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
    // Guardar las claves de productos vendidos (id o código) para inhabilitar luego los que queden en stock 0
    const soldKeys = new Set<any>(
      this.cart.map(ci => (ci.producto.id ?? ci.producto.codigoProducto))
    );
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
    const computedTotal = this.cartTotal; // total ya con descuento aplicado
    const computedChange = this.change; // cambio calculado antes de modificar carrito o amountReceived
    // Construir un resumen de cliente en observaciones (workaround mientras el backend no soporta clienteId)
    let observaciones: string | undefined = undefined;
    try {
      const cli = this.selectedClienteData;
      if (cli) {
        const nombre = (cli.nombre || '').trim();
        const apellido = (cli.apellido || '').trim();
        const numero = (cli.numero || '').trim();
        const full = `${nombre} ${apellido}`.trim();
        const base = full || numero;
        if (base) {
          observaciones = `Cliente: ${base}${numero && base !== numero ? ' - ' + numero : ''}`;
        }
      }
    } catch {}
    if (this.formaPago !== 'efectivo' && (!this.transaccionId || !this.transaccionId.trim())) {
      Swal.fire({
        icon: 'warning',
        title: 'ID de Transacción requerido',
        html: 'Debes ingresar el <b>ID de la Transacción</b> para pagos que no sean en efectivo.',
      });
      return;
    }

    const payload: CreateVentaPayload = {
      total: computedTotal,
      forma_pago: this.formaPago,
      estado: this.estadoVenta,
      descuentoId: this.selectedDescuentoId ?? undefined,
      observaciones,
      items,
      transaccionId: this.formaPago !== 'efectivo' ? this.transaccionId.trim() : undefined,
    };
    if (this.selectedClienteId != null) {
      (payload as any).clienteId = Number(this.selectedClienteId);
    }
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
    try { if ((payload as any)?.items) { console.table((payload as any).items); } } catch {}
    this.ventaService.create(payload).subscribe({
      next: () => {
        this.cart = [];
        this.saveCart();
        this.amountReceived = null;
        this.transaccionId = '';
        this.isSubmitting = false;
        try {
          Swal.fire({
            icon: 'success',
            title: 'Venta registrada',
            html: `Total: <b>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(payload.total)}</b><br>` +
                  `Cambio: <b>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(computedChange)}</b>`
          }).then(() => {
            // Refrescar productos y, para los vendidos que queden en stock 0, inhabilitarlos
            this.productoService.getAll(true).subscribe({
              next: (data) => {
                this.productos = data || [];
                for (const p of this.productos) {
                  const key = (p.id ?? p.codigoProducto);
                  if (!soldKeys.has(key)) continue;
                  const stock = Number(p.stockProducto ?? 0);
                  if (stock === 0 && p.id && p.estado !== false) {
                    this.productoService.setEstado(p.id, false).subscribe({
                      next: (updated) => {
                        const idx = this.productos.findIndex(pp => pp.id === updated.id);
                        if (idx >= 0) {
                          this.productos[idx] = { ...this.productos[idx], ...updated };
                        }
                      },
                      error: () => {
                        // En caso de error al inhabilitar, no interrumpir el flujo principal
                      }
                    });
                  }
                }
              },
              error: () => {
                this.productos = [];
              }
            });
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
  get grossTotal(): number {
    const sum = this.cart.reduce((acc, it) => acc + this.toPesos(it.subtotal), 0);
    return this.toPesos(sum);
  }

  get selectedDescuento(): Descuento | null {
    const id = Number(this.selectedDescuentoId);
    if (!Number.isFinite(id)) return null;
    return this.descuentos.find(d => d.id === id) || null;
  }

  get discountPercent(): number {
    return this.selectedDescuento?.porcentaje ?? 0;
  }

  get discountAmount(): number {
    const amt = Math.round(this.grossTotal * (this.discountPercent / 100));
    return amt > 0 ? this.toPesos(amt) : 0;
  }

  get cartTotal(): number {
    const discounted = this.grossTotal - this.discountAmount;
    return discounted > 0 ? this.toPesos(discounted) : 0;
  }

  get canPay(): boolean {
    return this.toPesos(this.amountReceived ?? 0) >= this.cartTotal && this.cartTotal > 0;
  }

  get change(): number {
    const recibido = this.toPesos(this.amountReceived ?? 0);
    const r = recibido - this.cartTotal;
    return r > 0 ? this.toPesos(r) : 0;
  }

  get selectedClienteData(): Clientes | null {
    const id = this.selectedClienteId;
    if (id == null) return null;
    const num = Number(id);
    if (!Number.isFinite(num)) return null;
    return this.clientes.find(c => c.id === num) || null;
  }

  get clientesFiltradosVenta(): Clientes[] {
    const q = (this.clienteSearchTerm || '').trim().toLowerCase();
    if (!q) return this.clientes;
    return this.clientes.filter(c => {
      const nombre = `${c.nombre || ''} ${c.apellido || ''}`.toLowerCase();
      const doc = String((c as any).documento || '').toLowerCase();
      const correo = (c.correo || '').toLowerCase();
      return nombre.includes(q) || doc.includes(q) || correo.includes(q);
    });
  }

  selectCliente(c: Clientes | null): void {
    if (!c) {
      this.selectedClienteId = null;
      return;
    }
    this.selectedClienteId = c.id;
  }

  get sortLabel(): string {
    switch (this.sortOption) {
      case 'todos': return 'Todos';
      case 'alfabetico': return 'Alfabéticamente';
      case 'masRentables': return 'Productos Más Rentables';
      case 'ultimasUnidades': return 'Últimas Unidades Disponibles';
      default: return 'Productos más Vendidos';
    }
  }

  private isAnimating = false;
  addedBubbleVisible = false;
  addedBubbleText = '';
  addedBubbleIsError = false;
  addedBubbleProductName: string | null = null;
  private addedBubbleTimeout: any;
  private clearSearchTimeout: any;

  onProductClick(evt: MouseEvent, p: Producto): void {
    if (this.isAnimating) return;
    // No permitir seleccionar si el producto está inhabilitado
    if (p?.estado === false) return;
    // No hacer nada si ya no hay stock disponible (stock físico menos lo que ya está en canasta)
    const available = this.getAvailableStock(p);
    if (available <= 0) return;
    const added = this.addToCart(p);
    if (!added) return;
    this.isAnimating = true;
    this.modernFlyToCart(evt).finally(() => { this.isAnimating = false; });
  }

  addToCart(p: Producto): boolean {
    const available = this.getAvailableStock(p);
    if (available <= 0) return false;
    const price = this.toPesos((p.precioComercial ?? p.precioUnitario) || 0);
    const key = (p.id ?? p.codigoProducto);
    const found = this.cart.find(ci => (ci.producto.id ?? ci.producto.codigoProducto) === key);
    let changed = false;
    if (found) {
      // Respetar el stock físico máximo por producto
      if (found.cantidad < (p.stockProducto ?? 0)) {
        found.cantidad += 1;
        found.subtotal = this.toPesos(found.cantidad * price);
        changed = true;
      }
    } else {
      this.cart.push({ producto: p, cantidad: 1, subtotal: this.toPesos(price) });
      changed = true;
    }
    if (changed) {
      this.saveCart();
      this.showAddedBubble(p);
      return true;
    }
    return false;
  }

  private showAddedBubble(p: Producto): void {
    const name = (p.nombreProducto || '').toString().trim();
    this.addedBubbleProductName = name || null;
    this.addedBubbleIsError = false;
    this.addedBubbleText = name ? `Producto "${name}" Agregado` : 'Producto Agregado a la Canasta';
    this.addedBubbleVisible = true;
    if (this.addedBubbleTimeout) {
      clearTimeout(this.addedBubbleTimeout);
    }
    this.addedBubbleTimeout = setTimeout(() => {
      this.addedBubbleVisible = false;
    }, 500);
  }

  private showNoStockBubble(p?: Producto): void {
    const name = (p?.nombreProducto || '').toString().trim();
    this.addedBubbleProductName = name || null;
    this.addedBubbleIsError = true;
    this.addedBubbleText = name ? `Producto "${name}" SIN STOCK` : 'Producto SIN STOCK';
    this.addedBubbleVisible = true;
    if (this.addedBubbleTimeout) {
      clearTimeout(this.addedBubbleTimeout);
    }
    this.addedBubbleTimeout = setTimeout(() => {
      this.addedBubbleVisible = false;
    }, 1000);
  }

  private modernFlyToCart(evt: MouseEvent): Promise<void> {
    try {
      return new Promise<void>((resolve) => {
        const sourceEl = (evt.currentTarget as HTMLElement) || (evt.target as HTMLElement);
        if (!sourceEl) { resolve(); return; }
        const img: HTMLImageElement | null = sourceEl.querySelector('img');
        if (!img) { resolve(); return; }
        const cartEl: HTMLElement | null = this.getCartTarget();
        if (!cartEl) { resolve(); return; }

        const imgRect = img.getBoundingClientRect();
        const cartRect = cartEl.getBoundingClientRect();

        const startX = imgRect.left + imgRect.width / 2;
        const startY = imgRect.top + imgRect.height / 2;
        const endX = cartRect.left + cartRect.width / 2;
        const endY = cartRect.top + cartRect.height / 2;

        const blob = document.createElement('div');
        const size = Math.max(32, Math.min(56, Math.floor(Math.min(imgRect.width, imgRect.height) * 0.35)));
        blob.style.position = 'fixed';
        blob.style.left = `${startX - size / 2}px`;
        blob.style.top = `${startY - size / 2}px`;
        blob.style.width = `${size}px`;
        blob.style.height = `${size}px`;
        blob.style.borderRadius = '999px';
        blob.style.background = 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(99,102,241,0.95) 55%, rgba(99,102,241,0.6) 80%, rgba(99,102,241,0.0) 100%)';
        blob.style.boxShadow = '0 10px 24px rgba(99,102,241,0.45), 0 3px 10px rgba(99,102,241,0.35)';
        blob.style.filter = 'blur(0.3px)';
        blob.style.zIndex = '10000';
        blob.style.pointerEvents = 'none';
        document.body.appendChild(blob);

        // Trayecto curvo más marcado
        const midX = startX + (endX - startX) * 0.55;
        const midY = startY + (endY - startY) * 0.55 - Math.max(100, Math.min(200, (endY - startY) * -0.25));

        const keyframes: Keyframe[] = [
          { transform: 'translate(0,0) scale(0.9) rotate(-6deg)', opacity: 0.98, offset: 0 },
          { transform: `translate(${midX - startX}px, ${midY - startY}px) scale(1.08) rotate(6deg)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.42) rotate(0deg)`, opacity: 0.75, offset: 1 }
        ];
        const timing: KeyframeAnimationOptions = { duration: 900, easing: 'cubic-bezier(0.18, 0.8, 0.2, 1)', fill: 'forwards' };
        const anim = blob.animate(keyframes, timing);

        // Partículas en el trayecto (trail)
        try {
          const trailCount = 5;
          for (let i = 0; i < trailCount; i++) {
            const t = document.createElement('div');
            t.style.position = 'fixed';
            t.style.left = `${startX - 3}px`;
            t.style.top = `${startY - 3}px`;
            t.style.width = '6px';
            t.style.height = '6px';
            t.style.borderRadius = '999px';
            t.style.background = 'rgba(99,102,241,0.65)';
            t.style.boxShadow = '0 0 10px rgba(99,102,241,0.6)';
            t.style.pointerEvents = 'none';
            t.style.zIndex = '9999';
            document.body.appendChild(t);
            const tDelay = 60 * i;
            const tAnim = t.animate(
              [
                { transform: 'translate(0,0)', opacity: 0.0 },
                { transform: `translate(${(midX - startX) * 0.9}px, ${(midY - startY) * 0.9}px)`, opacity: 0.5 },
                { transform: `translate(${endX - startX}px, ${endY - startY}px)`, opacity: 0 }
              ],
              { duration: 900, delay: tDelay, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'forwards' }
            );
            tAnim.addEventListener('finish', () => { try { t.remove(); } catch {} });
          }
        } catch {}

        const finish = () => {
          try { blob.remove(); } catch {}
          // Sparkles al llegar
          try {
            const sparks = 8;
            for (let i = 0; i < sparks; i++) {
              const sp = document.createElement('div');
              sp.style.position = 'fixed';
              sp.style.left = `${endX}px`;
              sp.style.top = `${endY}px`;
              sp.style.width = '6px';
              sp.style.height = '6px';
              sp.style.borderRadius = '999px';
              const colors = ['#818cf8', '#34d399', '#fbbf24', '#f472b6'];
              sp.style.background = colors[i % colors.length];
              sp.style.zIndex = '10001';
              sp.style.pointerEvents = 'none';
              document.body.appendChild(sp);
              const angle = (Math.PI * 2 * i) / sparks;
              const dist = 18 + Math.random() * 12;
              sp.animate(
                [
                  { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
                  { transform: `translate(${Math.cos(angle) * dist - 50}%, ${Math.sin(angle) * dist - 50}%) scale(0)`, opacity: 0 }
                ],
                { duration: 450, easing: 'ease-out' }
              ).addEventListener('finish', () => { try { sp.remove(); } catch {} });
            }
          } catch {}
          // Cart/list pulse y +1 cerca del objetivo
          try {
            cartEl.animate(
              [
                { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 rgba(59,130,246,0))' },
                { transform: 'scale(1.15)', filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.55))' },
                { transform: 'scale(1)' }
              ],
              { duration: 340, easing: 'ease-out' }
            );
            const bubble = document.createElement('div');
            bubble.textContent = '+1';
            bubble.style.position = 'fixed';
            bubble.style.left = `${cartRect.right - 6}px`;
            bubble.style.top = `${cartRect.top}px`;
            bubble.style.transform = 'translate(-50%, -50%)';
            bubble.style.padding = '2px 6px';
            bubble.style.borderRadius = '999px';
            bubble.style.fontWeight = '700';
            bubble.style.fontSize = '12px';
            bubble.style.color = '#fff';
            bubble.style.background = '#10b981';
            bubble.style.zIndex = '10002';
            bubble.style.pointerEvents = 'none';
            bubble.style.opacity = '0.95';
            document.body.appendChild(bubble);
            bubble.animate(
              [
                { transform: 'translate(-50%, -50%) translateY(0)', opacity: 0.95 },
                { transform: 'translate(-50%, -50%) translateY(-18px)', opacity: 0 }
              ],
              { duration: 520, easing: 'ease-out' }
            ).addEventListener('finish', () => { try { bubble.remove(); } catch {}; resolve(); });
          } catch {}
        };
        anim.addEventListener('finish', finish, { once: true });
      });
    } catch { return Promise.resolve(); }
  }

  private getCartTarget(): HTMLElement | null {
    try {
      const isDesktop = (window.innerWidth || 0) >= 768;
      const desktopList = document.getElementById('canasta-lista-desktop');
      if (isDesktop && desktopList) {
        const lastItem = desktopList.querySelector('li.list-group-item:last-child') as HTMLElement | null;
        if (lastItem) return lastItem;
        return desktopList;
      }
      const mobileCount = document.getElementById('cart-count');
      if (mobileCount) return mobileCount as HTMLElement;
      const fallback = document.querySelector('.cart-float') as HTMLElement | null;
      return fallback;
    } catch { return null; }
  }

  getCartQuantityFor(p: Producto): number {
    const key = (p.id ?? p.codigoProducto);
    const found = this.cart.find(ci => (ci.producto.id ?? ci.producto.codigoProducto) === key);
    return found?.cantidad ?? 0;
  }

  getAvailableStock(p: Producto): number {
    const base = Math.max(0, Number(p.stockProducto ?? 0));
    const inCart = this.getCartQuantityFor(p);
    const available = base - inCart;
    return available > 0 ? available : 0;
  }

  increment(item: { producto: Producto; cantidad: number; subtotal: number }, event?: Event): void {
    const p = item.producto;
    const price = this.toPesos((p.precioComercial ?? p.precioUnitario) || 0);
    if (item.cantidad < (p.stockProducto ?? 0)) {
      item.cantidad += 1;
      item.subtotal = this.toPesos(item.cantidad * price);
      this.saveCart();
      const anchor = (event?.currentTarget as HTMLElement | null)?.closest('li.list-group-item') as HTMLElement | null;
      this.showDeltaBubble(+1, anchor);
    }
  }

  decrement(item: { producto: Producto; cantidad: number; subtotal: number }, event?: Event): void {
    const p = item.producto;
    const price = this.toPesos((p.precioComercial ?? p.precioUnitario) || 0);
    if (item.cantidad > 1) {
      item.cantidad -= 1;
      item.subtotal = this.toPesos(item.cantidad * price);
      this.saveCart();
      const anchor = (event?.currentTarget as HTMLElement | null)?.closest('li.list-group-item') as HTMLElement | null;
      this.showDeltaBubble(-1, anchor);
    } else {
      this.remove(item);
      const anchor = (event?.currentTarget as HTMLElement | null)?.closest('li.list-group-item') as HTMLElement | null;
      this.showDeltaBubble(-1, anchor);
    }
  }

  updateQuantity(item: { producto: Producto; cantidad: number; subtotal: number }, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const raw = input?.value ?? '';
    const p = item.producto;
    const maxStock = Math.max(0, Number(p.stockProducto ?? 0));
    let qty = Number(raw);
    if (!Number.isFinite(qty) || qty <= 0) {
      qty = 1;
    }
    if (maxStock > 0 && qty > maxStock) {
      qty = maxStock;
    }
    const prev = item.cantidad;
    if (qty === prev) {
      return;
    }
    const price = this.toPesos((p.precioComercial ?? p.precioUnitario) || 0);
    item.cantidad = qty;
    item.subtotal = this.toPesos(qty * price);
    if (input) {
      input.value = String(qty);
    }
    this.saveCart();
    const delta = qty - prev;
    if (delta !== 0) {
      const anchor = (event.currentTarget as HTMLElement | null)?.closest('li.list-group-item') as HTMLElement | null;
      this.showDeltaBubble(delta, anchor);
    }
  }

  onQuantityKeyDown(item: { producto: Producto; cantidad: number; subtotal: number }, event: KeyboardEvent): void {
    const p = item.producto;
    const maxStock = Math.max(0, Number(p.stockProducto ?? 0));
    if (!maxStock) {
      return;
    }
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }

    const key = event.key;

    // Permitir teclas de control comunes
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (controlKeys.includes(key)) {
      return;
    }

    // Bloquear ArrowUp cuando ya está en el máximo
    const currentVal = Number(input.value || '0');
    if (key === 'ArrowUp') {
      if (currentVal >= maxStock) {
        event.preventDefault();
      }
      return;
    }

    // Solo validar dígitos; dejar pasar otras teclas (por ejemplo, Tab ya salió antes)
    if (!/^\d$/.test(key)) {
      return;
    }

    const value = input.value;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const newValue = value.slice(0, start) + key + value.slice(end);
    const num = Number(newValue);
    if (Number.isFinite(num) && num > maxStock) {
      event.preventDefault();
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
    let list = this.productos;
    if (!this.showDisabled) {
      list = list.filter(p => p.estado !== false);
    }
    if (!q) return list;
    return list.filter(p =>
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

  onSearchEnter(event: Event): void {
    event.preventDefault();
    const raw = (this.searchTerm || '').trim();
    if (!raw) {
      return;
    }
    const q = raw.toLowerCase();
    const found = this.productos.find(p => String(p.codigoProducto || '').trim().toLowerCase() === q);
    if (!found) {
      return;
    }
    // Si no hay stock disponible (físico menos lo que ya está en canasta), mostrar burbuja de "sin stock" y no agregar
    const available = this.getAvailableStock(found);
    if (available <= 0) {
      this.showNoStockBubble(found);
      // Limpiar el buscador después de 1 segundos
      setTimeout(() => {
        try {
          this.searchTerm = '';
          const el = this.searchInput?.nativeElement;
          if (el) {
            el.value = '';
          }
        } catch {}
      }, 1000);
      return;
    }
    if (found.estado === false) {
      return;
    }
    const added = this.addToCart(found);
    if (!added) {
      return;
    }
    // Mostrar burbuja +1 anclada al item correspondiente en la canasta (desktop)
    try {
      const key = (found.id ?? found.codigoProducto);
      const selector = `#canasta-lista-desktop li.list-group-item[data-key="${key}"]`;
      const liEl = document.querySelector(selector) as HTMLElement | null;
      this.showDeltaBubble(+1, liEl || undefined);
    } catch {
      this.showDeltaBubble(+1);
    }
    this.showAddedBubble(found);

    // Mantener el filtro de productos con el código usado por unos segundos
    const termAtAdd = this.searchTerm;

    // Limpiar inmediatamente solo el input visual para poder tipear el siguiente código
    setTimeout(() => {
      try {
        const el = this.searchInput?.nativeElement;
        if (el) {
          el.value = '';
          el.focus();
        }
      } catch {}
    }, 0);

    // Cancelar cualquier limpieza anterior programada
    if (this.clearSearchTimeout) {
      clearTimeout(this.clearSearchTimeout);
    }

    // Después de ~5 milisegundos, si el usuario no cambió la búsqueda, limpiar el filtro
    this.clearSearchTimeout = setTimeout(() => {
      const current = (this.searchTerm || '').trim().toLowerCase();
      const atAdd = (termAtAdd || '').trim().toLowerCase();
      if (current === atAdd) {
        this.searchTerm = '';
      }
    }, 500);
  }

  constructor(
    private productoService: ProductoService,
    private ventaService: VentaService,
    private descuentoService: DescuentoService,
    private clientesService: ClientesService,
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      try {
        this.searchInput?.nativeElement.focus();
        this.searchInput?.nativeElement.select();
      } catch {}
    }, 0);
  }

  ngOnInit(): void {
    this.loadCart();
    this.loadProductos();
    // cargar promociones/descuentos válidos (activos y dentro de vigencia si aplica)
    this.descuentoService.items$.subscribe((list) => {
      const now = Date.now();
      this.descuentos = (list || []).filter((d) => {
        if (!d.activo) return false;
        if (d.fechaInicio && now < d.fechaInicio) return false;
        if (d.fechaFin && now > d.fechaFin) return false;
        return true;
      });
    });
    this.descuentoService.fetchAll().subscribe();
    // cargar clientes (por defecto solo activos)
    try {
      this.clientesService.getClientes().subscribe({
        next: (data) => {
          const list = data || [];
          this.clientes = list.filter(c => (c.estado || '').toLowerCase() === 'activo');
        },
        error: () => {
          this.clientes = [];
        }
      });
    } catch {}
  }

  private loadProductos(): void {
    // Mostrar todos en POS, incluidos inhabilitados (se verán grises y no seleccionables)
    this.productoService.getAll(true).subscribe({
      next: (data) => (this.productos = data || []),
      error: () => (this.productos = [])
    });
  }

  toImageUrl(img?: string | null): string {
    if (!img) return this.baseImageUrl + 'default.jpg';
    const s = String(img).trim();
    if (s === '') return this.baseImageUrl + 'default.jpg';
    // Normalizar nombres antiguos de default
    if (s.toLowerCase().startsWith('default') && s.toLowerCase() !== 'default.jpg') {
      return this.baseImageUrl + 'default.jpg';
    }
    // URLs absolutas a localhost → reescribir a environment.apiUrl
    if (s.startsWith('http://localhost') || s.startsWith('https://localhost')) {
      try {
        const url = new URL(s);
        const path = url.pathname.replace(/^\/+/, '');
        const baseApi = environment.apiUrl.replace(/\/+$/, '');
        return `${baseApi}/${path}`;
      } catch {
        // fallback a lógica normal
      }
    }
    // Otras URLs absolutas o data URI
    if (s.startsWith('http') || s.startsWith('data:')) return s;
    // Rutas tipo '/storage/archivo.jpg' o 'storage/archivo.jpg'
    if (s.startsWith('/storage/') || s.startsWith('storage/')) {
      const clean = s.replace(/^\/+/, '');
      const baseApi = environment.apiUrl.replace(/\/+$/, '');
      return `${baseApi}/${clean}`;
    }
    // Caso general: nombre de archivo relativo en storage
    return this.baseImageUrl + s.replace(/^\/+/, '');
  }
}
