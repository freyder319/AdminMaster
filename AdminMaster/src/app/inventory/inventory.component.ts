import { Component, ViewChild } from '@angular/core';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { CreateProductoComponent } from "../create_producto/create_producto.component";
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [AdminNavbarComponent,CreateProductoComponent,FormsModule,MatPaginatorModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent {
  totalItems = 50;     // total de productos (ejemplo)
  pageSize = 10;       // cuantos mostrar por página
  pageIndex = 0;       // página actual

  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    console.log('Página actual:', this.pageIndex, ' | Tamaño:', this.pageSize);
  }
}

