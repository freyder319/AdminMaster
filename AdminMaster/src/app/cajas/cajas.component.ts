import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AddCajasComponent } from "../add_cajas/add_cajas.component";
import { ModifyCajaComponent } from '../modify-caja/modify-caja.component';

@Component({
  selector: 'app-cajas',
  standalone: true,
  imports: [AdminNavbarComponent, AddCajasComponent, ModifyCajaComponent, CommonModule, RouterModule],
  templateUrl: './cajas.component.html',
  styleUrl: './cajas.component.scss'
})
export class CajasComponent {
  mostrarAddCaja = false; 
  mostrarModificarCaja = false;
}
