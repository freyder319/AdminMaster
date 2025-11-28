import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AddClientesComponent } from "../add_clientes/add_clientes.component";
import { ModifyClienteComponent } from "../modify-cliente/modify-cliente.component";
import { Clientes, ClientesService } from '../services/clientes.service';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { VentaService } from '../services/venta.service';
import { AgenteIAComponent } from "../agente-ia/agente-ia.component";

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [AdminNavbarComponent, AddClientesComponent, ModifyClienteComponent, CommonModule, RouterModule, NgFor, FormsModule, AgenteIAComponent],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent {
  clienteSeleccionado: Clientes  | null=null;
  mostrarAddCliente = false; 
  mostrarModificarCliente = false;
  clientes:Clientes[] = [];
  searchTerm: string = '';
  rol: string | null = null;
  get clientesFiltrados(): Clientes[] {
    const q = (this.searchTerm || '').trim().toLowerCase();
    const base = !q ? this.clientes : this.clientes.filter(c => {
      const nombre = (c.nombre || '').toLowerCase();
      const correo = (c.correo || '').toLowerCase();
      const numero = String(c.numero || '').toLowerCase();
      const estado = (c.estado || '').toLowerCase();
      return nombre.includes(q) || correo.includes(q) || numero.includes(q) || estado.includes(q);
    });
    // ordenar: activos primero, inactivos al final
    return [...base].sort((a,b) => {
      const aIna = (a.estado || '').toLowerCase() === 'inactivo' ? 1 : 0;
      const bIna = (b.estado || '').toLowerCase() === 'inactivo' ? 1 : 0;
      return aIna - bIna;
    });
  }
  private clientesEnUso = new Set<number>();
  private comprasPorCliente = new Map<number, number>();
  private deudasPorCliente = new Map<number, number>();
  constructor (private clientesServices: ClientesService, private ventaService: VentaService){}

  focusFirstInput(offcanvasId: string): void {
    const offcanvas = document.getElementById(offcanvasId);
    if (!offcanvas) return;

    let input = offcanvas.querySelector('input[data-autofocus="true"]') as HTMLInputElement | null;
    if (!input) {
      input = offcanvas.querySelector('input') as HTMLInputElement | null;
    }

    if (input) {
      setTimeout(() => {
        input?.focus();
        (input as any)?.select?.();
      }, 50);
    }
  }
  ngOnInit():void{
    try {
      const rawRol = localStorage.getItem('rol');
      this.rol = rawRol ? rawRol.trim().toLowerCase() : null;
    } catch {
      this.rol = null;
    }
    this.clientesServices.getClientes().subscribe({
    next: (data) => this.clientes = data,
    error: (error) => console.error('Error al cargar Clientes:',error)
  });
  // cargar ventas y construir set de clientes en uso + conteo de compras por cliente y deudas (ventas pendientes)
  try {
    this.ventaService.list().subscribe({
      next: (ventas) => {
        const ids: number[] = [];
        const contadorCompras = new Map<number, number>();
        const contadorDeudas = new Map<number, number>();

        (ventas || []).forEach((v: any) => {
          const cliId = v?.clienteId;
          if (typeof cliId === 'number' && Number.isFinite(cliId)) {
            ids.push(cliId);

            // todas las ventas (cualquier estado) cuentan como compra
            const actualCompras = contadorCompras.get(cliId) ?? 0;
            contadorCompras.set(cliId, actualCompras + 1);

            // solo las ventas en estado pendiente cuentan como deuda
            const estado = (v?.estado || '').toString().toLowerCase();
            if (estado === 'pendiente') {
              const actualDeudas = contadorDeudas.get(cliId) ?? 0;
              contadorDeudas.set(cliId, actualDeudas + 1);
            }
          }
        });

        this.clientesEnUso = new Set<number>(ids);
        this.comprasPorCliente = contadorCompras;
        this.deudasPorCliente = contadorDeudas;
      },
      error: (err) => console.error('Error al Cargar Ventas para relación de Clientes:', err)
    });
  } catch {}
  }
  guardarId(id:number){
    this.clienteSeleccionado = this.clientes.find(c => c.id === id) || null;
  }
  mostrarInterfazReponsive(id:number){
    this.clienteSeleccionado = this.clientes.find(c => c.id === id) || null;
    this.mostrarModificarCliente = true;
  }
  eliminarCliente(id:number){
    Swal.fire({
    title: "Estas Seguro?",
    html: `Realmente Deseas Eliminar al cliente</b>?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Si, Eliminar!"
  }).then((result) => {
    if (result.isConfirmed) {
      this.clientesServices.deleteCliente(id).subscribe({
        next: () => {
          Swal.fire({
            title: "Eliminado!",
            html: `Cliente Eliminado.`,
            icon: "success"
          });
          this.mostrarModificarCliente = false;
          this.ngOnInit();
        },
        error: (err)=> {
          const backendMsg = err?.error?.message || '';
          const related = typeof backendMsg === 'string' && backendMsg.toLowerCase().includes('relacion');
          if (related && this.clienteSeleccionado && this.clienteSeleccionado.id === id) {
            Swal.fire({
              title: 'Cliente relacionado',
              text: 'No se puede Eliminar porque tiene Registros relacionados. ¿Deseas Inhabilitarlo?',
              icon: 'info',
              showCancelButton: true,
              confirmButtonText: 'Inhabilitar',
              cancelButtonText: 'Cerrar'
            }).then(r => {
              if (r.isConfirmed) this.inhabilitarCliente(this.clienteSeleccionado!);
            });
          } else {
            const mensaje = backendMsg || (err.status === 404 ? 'El cliente no existe o ya fue eliminado.' : 'No se pudo eliminar el cliente');
            Swal.fire({ icon: 'error', title: 'Error', text: mensaje });
          }
        }
      })
      
    }
  });
  }
  onClienteAgregado(){
    this.ngOnInit();
    this.mostrarAddCliente = false; 
  }
  onClienteModificado(){
    this.ngOnInit();
    this.mostrarModificarCliente = false;
  }

  inhabilitarCliente(c: Clientes) {
    const estado = (c.estado || '').toLowerCase();
    if (estado === 'inactivo') return;
    this.clientesServices.updateCliente(c.id, { estado: 'inactivo' }).subscribe({
      next: (updated) => {
        // actualizar lista local
        const idx = this.clientes.findIndex(x => x.id === c.id);
        if (idx >= 0) {
          this.clientes[idx] = { ...this.clientes[idx], estado: 'inactivo' } as Clientes;
        }
        this.clientes = [...this.clientes];

        // si está abierto en la vista móvil, reflejar el cambio inmediatamente
        if (this.clienteSeleccionado && this.clienteSeleccionado.id === c.id) {
          this.clienteSeleccionado = {
            ...this.clienteSeleccionado,
            estado: 'inactivo'
          } as Clientes;
        }
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo Inhabilitar el Cliente' });
      }
    });
  }

  habilitarCliente(c: Clientes) {
    const estado = (c.estado || '').toLowerCase();
    if (estado === 'activo') return;
    this.clientesServices.updateCliente(c.id, { estado: 'activo' }).subscribe({
      next: (updated) => {
        const idx = this.clientes.findIndex(x => x.id === c.id);
        if (idx >= 0) {
          this.clientes[idx] = { ...this.clientes[idx], estado: 'activo' } as Clientes;
        }
        this.clientes = [...this.clientes];

        // si está abierto en la vista móvil, reflejar el cambio inmediatamente
        if (this.clienteSeleccionado && this.clienteSeleccionado.id === c.id) {
          this.clienteSeleccionado = {
            ...this.clienteSeleccionado,
            estado: 'activo'
          } as Clientes;
        }
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo Habilitar el Cliente' });
      }
    });
  }

  isClienteEnUso(idOrC: number | Clientes | null | undefined): boolean {
    if (idOrC == null) return false;
    const id = typeof idOrC === 'number' ? idOrC : idOrC.id;
    return this.clientesEnUso.has(id);
  }

  estadoCliente(p: Clientes | null | undefined): 'Activo' | 'Inactivo' {
    if (!p) return 'Inactivo';
    const estado = (p.estado || '').toLowerCase();
    return estado === 'activo' ? 'Activo' : 'Inactivo';
  }

  getNumeroCompras(c: Clientes | null | undefined): number {
    if (!c) return 0;
    return this.comprasPorCliente.get(c.id) ?? 0;
  }

  getDeudas(c: Clientes | null | undefined): number {
    if (!c) return 0;
    return this.deudasPorCliente.get(c.id) ?? 0;
  }
}