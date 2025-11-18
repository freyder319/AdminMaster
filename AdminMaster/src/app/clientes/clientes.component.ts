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

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [AdminNavbarComponent, AddClientesComponent, ModifyClienteComponent, CommonModule, RouterModule, NgFor, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent {
  clienteSeleccionado: Clientes  | null=null;
  mostrarAddCliente = false; 
  mostrarModificarCliente = false;
  clientes:Clientes[] = [];
  searchTerm: string = '';
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
  constructor (private clientesServices: ClientesService, private ventaService: VentaService){}
  ngOnInit():void{
    this.clientesServices.getClientes().subscribe({
    next: (data) => this.clientes = data,
    error: (error) => console.error('Error al cargar clientes:',error)
  });
  // cargar ventas y construir set de clientes en uso
  try {
    this.ventaService.list().subscribe({
      next: (ventas) => {
        const ids = (ventas || [])
          .map((v: any) => v?.clienteId)
          .filter((v: any) => typeof v === 'number' && Number.isFinite(v));
        this.clientesEnUso = new Set<number>(ids);
      },
      error: (err) => console.error('Error al cargar ventas para relación de clientes:', err)
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
              text: 'No se puede eliminar porque tiene registros relacionados. ¿Deseas inhabilitarlo?',
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
        if (idx >= 0) this.clientes[idx] = { ...this.clientes[idx], estado: 'inactivo' } as Clientes;
        this.clientes = [...this.clientes];
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo inhabilitar el cliente' });
      }
    });
  }

  habilitarCliente(c: Clientes) {
    const estado = (c.estado || '').toLowerCase();
    if (estado === 'activo') return;
    this.clientesServices.updateCliente(c.id, { estado: 'activo' }).subscribe({
      next: (updated) => {
        const idx = this.clientes.findIndex(x => x.id === c.id);
        if (idx >= 0) this.clientes[idx] = { ...this.clientes[idx], estado: 'activo' } as Clientes;
        this.clientes = [...this.clientes];
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo habilitar el cliente' });
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
}