import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { CreateProductoComponent } from "../create_producto/create_producto.component";

@Component({
  selector: 'app-inventory',
  imports: [AdminNavbarComponent, CreateProductoComponent],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent {

}

