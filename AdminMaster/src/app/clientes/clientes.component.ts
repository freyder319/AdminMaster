import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin-navbar/admin-navbar.component";
import { AddClientesComponent } from "../add-clientes/add-clientes.component";

@Component({
  selector: 'app-clientes',
  imports: [AdminNavbarComponent, AddClientesComponent],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent {

}
