import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AddProveedorComponent } from "../add_proveedor/add_proveedor.component";
import { ModifyProveedorComponent } from '../modify-proveedor/modify-proveedor.component';

@Component({
  selector: 'app_proveedores',
  standalone: true,
  imports: [AdminNavbarComponent, AddProveedorComponent, CommonModule,RouterModule, ModifyProveedorComponent],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.scss']
})
export class ProveedoresComponent {
  mostrarAddProveedor = false; 
  mostrarModificarProveedor = false;
}
