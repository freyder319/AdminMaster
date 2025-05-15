import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AddProveedorComponent } from "../add_proveedor/add_proveedor.component";

@Component({
  selector: 'app_proveedores',
  imports: [AdminNavbarComponent, AddProveedorComponent],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.scss']
})

export class ProveedoresComponent {

}



