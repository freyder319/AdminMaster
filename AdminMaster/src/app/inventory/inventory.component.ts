import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { CreateProductoComponent } from "../create_producto/create_producto.component";
import { CreateCategoriaComponent } from "../create_categoria/create_categoria.component";

@Component({
  selector: 'app-inventory',
  imports: [AdminNavbarComponent, CreateProductoComponent, CreateCategoriaComponent],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent {

}

