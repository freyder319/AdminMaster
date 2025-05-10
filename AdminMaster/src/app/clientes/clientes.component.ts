import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AddClientesComponent } from "../add_clientes/add_clientes.component";

@Component({
  selector: 'app-clientes',
  imports: [AdminNavbarComponent, AddClientesComponent],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent {

}
