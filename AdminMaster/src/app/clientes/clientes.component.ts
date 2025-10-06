import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AddClientesComponent } from "../add_clientes/add_clientes.component";
import { ModifyClienteComponent } from "../modify-cliente/modify-cliente.component";
import { Clientes, ClientesService } from '../services/clientes.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [AdminNavbarComponent, AddClientesComponent, ModifyClienteComponent, CommonModule, RouterModule,NgFor],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent {
  clienteSeleccionado: Clientes  | null=null;
  mostrarAddCliente = false; 
  mostrarModificarCliente = false;
  clientes:Clientes[] = [];
  constructor (private clientesServices: ClientesService){}
  ngOnInit():void{
    this.clientesServices.getClientes().subscribe({
    next: (data) => this.clientes = data,
    error: (error) => console.error('Error al cargar clientes:',error)
  });
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
          let mensaje = 'Ocurrió un error al eliminar el cliente';
          if (err.status >= 500) {
            mensaje = 'Error en el servidor. Intente más tarde.';
          } else if (err.status === 404) {
            mensaje = 'El cliente no existe o ya fue eliminado.';
          } else if (err.status === 400) {
            mensaje = 'Solicitud inválida.';
          }
          Swal.fire({
            icon: "error",
            title: "Error...",
            text: mensaje,
          });
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
}