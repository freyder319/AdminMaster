import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin-navbar/admin-navbar.component";
import { CreateProductoComponent } from "../create-producto/create-producto.component";

@Component({
  selector: 'app-inventory',
  imports: [AdminNavbarComponent, CreateProductoComponent],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent {

}
