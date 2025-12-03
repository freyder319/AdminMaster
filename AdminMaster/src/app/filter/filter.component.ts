import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Clientes, ClientesService } from '../services/clientes.service';
import { Proveedor, ProveedorService } from '../services/proveedor.service';
import { CreateVentaPayload } from '../services/venta.service';
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

  @Output() filtersChange = new EventEmitter<{
    forma_pago: CreateVentaPayload['forma_pago'] | '';
    clienteId: number | '';
    proveedorId: number | '';
  }>();

  exportar(): void {
    // ya no se usa exportar desde este componente; la exportación se hace en admin_principal
  }

  constructor(
    private clientesSrv: ClientesService,
    private proveedorSrv: ProveedorService,
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
    this.filtersChange.emit({
      forma_pago: this.selectedMetodo,
      clienteId: this.selectedClienteId,
      proveedorId: this.selectedProveedorId,
    });
  }

  filtrar(): void {
    this.filtersChange.emit({
      forma_pago: this.selectedMetodo,
      clienteId: this.selectedClienteId,
      proveedorId: this.selectedProveedorId,
    });
    // cerrar dropdown solo cuando se filtra
    try {
      const openDropdown = document.querySelector('.dropdown-menu.show') as HTMLElement | null;
      if (openDropdown) {
        const dropdownToggle = openDropdown.previousElementSibling as HTMLElement | null;
        if (dropdownToggle && dropdownToggle.getAttribute('data-bs-toggle') === 'dropdown') {
          const dropdownInstance = (window as any).bootstrap?.Dropdown?.getInstance(dropdownToggle);
          if (dropdownInstance) {
            dropdownInstance.hide();
          } else {
            // Fallback: simular clic en el botón para cerrar
            dropdownToggle.click();
          }
        }
      }
    } catch (error) {
      console.error('Error cerrando dropdown:', error);
    }
  }
}
