import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin-navbar/admin-navbar.component";
import { AddProveedorComponent } from "../add-proveedor/add-proveedor.component";

@Component({
  selector: 'app-proveedores',
  imports: [AdminNavbarComponent, AddProveedorComponent],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.scss']
})


export class ProveedoresComponent {
  
}


