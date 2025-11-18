import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Producto, ProductoService } from '../services/producto.service';
import { VentaService, CreateVentaPayload } from '../services/venta.service';
import { Clientes, ClientesService } from '../services/clientes.service';
import { DescuentoService, Descuento } from '../services/descuento.service';
import Swal from 'sweetalert2';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
declare const bootstrap: any;

@Component({
  selector: 'app_venta_producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminNavbarComponent],
  templateUrl: './venta_producto.component.html',
  styleUrl: './venta_producto.component.scss'
})
export class VentaProductoComponent {
  productos: Producto[] = [];
  private baseImageUrl = 'http://localhost:3000/storage/';
  private storageKey = 'venta_cart';
  searchTerm: string = '';
  sortOption: 'masVendidos' | 'alfabetico' | 'masRentables' | 'ultimasUnidades' = 'masVendidos';
  // Mostrar también productos inhabilitados en la grilla
  showDisabled: boolean = false;
  cart: { producto: Producto; cantidad: number; subtotal: number }[] = [];
  amountReceived: number | null = null;
  formaPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'otros' = 'efectivo';
  isSubmitting = false;
  descuentos: Descuento[] = [];
  selectedDescuentoId: number | null = null;
  // Cliente asociado a la venta
  clientes: Clientes[] = [];
  selectedClienteId: number | null = null;

  private toPesos(n: any): number {
    const num = Number(n);
    return Number.isFinite(num) ? Math.round(num) : 0;
  }

  private showDeltaBubble(delta: number): void {
    try {
      const cartEl: HTMLElement | null = this.getCartTarget();
      if (!cartEl) return;
      const rect = cartEl.getBoundingClientRect();
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
    const payload: CreateVentaPayload = {
      total: computedTotal,
      forma_pago: this.formaPago,
      descuentoId: this.selectedDescuentoId ?? undefined,
      observaciones,
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
                  `Cambio: <b>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(computedChange)}</b>`
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

  get sortLabel(): string {
    switch (this.sortOption) {
      case 'alfabetico': return 'Alfabéticamente';
      case 'masRentables': return 'Productos Más Rentables';
      case 'ultimasUnidades': return 'Últimas Unidades Disponibles';
      default: return 'Productos más Vendidos';
    }
  }

  private isAnimating = false;

  onProductClick(evt: MouseEvent, p: Producto): void {
    if (this.isAnimating) return;
    // No permitir seleccionar si el producto está inhabilitado
    if (p?.estado === false) return;
    this.addToCart(p);
    this.isAnimating = true;
    this.modernFlyToCart(evt).finally(() => { this.isAnimating = false; });
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

  increment(item: { producto: Producto; cantidad: number; subtotal: number }): void {
    const p = item.producto;
    const price = this.toPesos((p.precioComercial ?? p.precioUnitario) || 0);
    if (item.cantidad < (p.stockProducto ?? 0)) {
      item.cantidad += 1;
      item.subtotal = this.toPesos(item.cantidad * price);
      this.saveCart();
      this.showDeltaBubble(+1);
    }
  }

  decrement(item: { producto: Producto; cantidad: number; subtotal: number }): void {
    const p = item.producto;
    const price = this.toPesos((p.precioComercial ?? p.precioUnitario) || 0);
    if (item.cantidad > 1) {
      item.cantidad -= 1;
      item.subtotal = this.toPesos(item.cantidad * price);
      this.saveCart();
      this.showDeltaBubble(-1);
    } else {
      this.remove(item);
      this.showDeltaBubble(-1);
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

  constructor(
    private productoService: ProductoService,
    private ventaService: VentaService,
    private descuentoService: DescuentoService,
    private clientesService: ClientesService,
  ) {}

  ngOnInit(): void {
    this.loadCart();
    this.loadProductos();
    // cargar descuentos
    this.descuentoService.items$.subscribe((list) => (this.descuentos = list || []));
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
    if (s.toLowerCase().startsWith('default') && s.toLowerCase() !== 'default.jpg') {
      return this.baseImageUrl + 'default.jpg';
    }
    if (s.startsWith('http') || s.startsWith('data:')) return s;
    return this.baseImageUrl + s.replace(/^\/+/, '');
  }
}
