import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AddClientesComponent } from "../add_clientes/add_clientes.component";
import { ModifyClienteComponent } from "../modify-cliente/modify-cliente.component";

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [AdminNavbarComponent, AddClientesComponent, ModifyClienteComponent, CommonModule, RouterModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent {
  mostrarAddCliente = false; 
  mostrarModificarCliente = false;
}
