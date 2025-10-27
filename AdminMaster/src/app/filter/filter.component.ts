import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Clientes, ClientesService } from '../services/clientes.service';
import { Proveedor, ProveedorService } from '../services/proveedor.service';
import { VentaService, CreateVentaPayload } from '../services/venta.service';
declare const bootstrap: any;
@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})
export class FilterComponent implements OnInit {
  metodosPago: Array<CreateVentaPayload['forma_pago']> = ['efectivo','tarjeta','transferencia','nequi','daviplata','otros'];
  selectedMetodo: CreateVentaPayload['forma_pago'] | '' = '';
  clientes: Clientes[] = [];
  proveedores: Proveedor[] = [];
  selectedClienteId: number | '' = '';
  selectedProveedorId: number | '' = '';
  loading = false;
  resultados: any[] = [];

  get columns(): string[] {
    if (!this.resultados || this.resultados.length === 0) return [];
    return Object.keys(this.resultados[0]);
  }

  exportar(): void {
    const base = 'http://localhost:3000/venta/report';
    const params = new URLSearchParams();
    if (this.selectedMetodo) params.set('forma_pago', String(this.selectedMetodo));
    const url = params.toString() ? `${base}?${params.toString()}` : base;
    window.open(url, '_blank');
  }

  constructor(
    private clientesSrv: ClientesService,
    private proveedorSrv: ProveedorService,
    private ventaSrv: VentaService,
  ) {}

  ngOnInit(): void {
    this.fetchData();
  }

  private fetchData(): void {
    this.clientesSrv.getClientes().subscribe({
      next: (list) => (this.clientes = list || []),
      error: () => (this.clientes = [])
    });
    this.proveedorSrv.fetchAll().subscribe({
      next: (list) => (this.proveedores = list || []),
      error: () => (this.proveedores = [])
    });
  }

  setMetodoPago(m: CreateVentaPayload['forma_pago']): void {
    this.selectedMetodo = (this.selectedMetodo === m) ? '' : m;
  }

  limpiar(): void {
    this.selectedMetodo = '';
    this.selectedClienteId = '';
    this.selectedProveedorId = '';
    this.resultados = [];
  }

  filtrar(): void {
    this.loading = true;
    this.ventaSrv.list({
      forma_pago: this.selectedMetodo,
      clienteId: this.selectedClienteId,
      proveedorId: this.selectedProveedorId,
    }).subscribe({
      next: (rows) => {
        this.resultados = rows || [];
        this.loading = false;
        // cerrar offcanvas si se abrió desde allí
        try {
          const open = document.querySelector('.offcanvas.show') as HTMLElement | null;
          const el = open || document.getElementById('filtro') || document.getElementById('staticBackdrop');
          if (el) {
            const inst = bootstrap?.Offcanvas?.getInstance(el) || new bootstrap.Offcanvas(el);
            inst?.hide?.();
          }
        } catch {}
        console.table(this.resultados);
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
