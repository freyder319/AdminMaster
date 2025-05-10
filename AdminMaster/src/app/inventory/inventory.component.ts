import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin-navbar/admin-navbar.component";
import { CreateProductoComponent } from "../create-producto/create-producto.component";
import { CreateCategoriaComponent } from "../create-categoria/create-categoria.component";

@Component({
  selector: 'app-inventory',
  imports: [AdminNavbarComponent, CreateProductoComponent, CreateCategoriaComponent],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent {

}

