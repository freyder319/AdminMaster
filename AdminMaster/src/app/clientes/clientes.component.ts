import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AddClientesComponent } from "../add_clientes/add_clientes.component";
import { ModifyClienteComponent } from "../modify-cliente/modify-cliente.component";
import { Clientes, ClientesService } from '../services/clientes.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [AdminNavbarComponent, AddClientesComponent, ModifyClienteComponent, CommonModule, RouterModule,NgFor],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent {
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
  eliminarCliente(id:number){
    console.log('id:',id);
  }
}