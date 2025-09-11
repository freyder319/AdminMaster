import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { CreateProductoComponent } from "../create_producto/create_producto.component";
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-inventory',
  imports: [AdminNavbarComponent, CreateProductoComponent, PaginatorModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent {

}

