import { Component, OnInit } from '@angular/core';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AddClientesComponent } from "../add_clientes/add_clientes.component";
import { Clientes, ClientesService } from '../services/clientes.service';
import { NgFor } from "@angular/common";

@Component({
  selector: 'app-clientes',
  imports: [AdminNavbarComponent, AddClientesComponent, NgFor],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit {
  clientes: Clientes[] = [];
  constructor(private clientesServices: ClientesService){}
  ngOnInit(): void {
      this.clientesServices.getClientes().subscribe({
        next: (data) => this.clientes = data,
        error: (error) => console.error('Error al cargar clientes:', error)
      });
  }
}
