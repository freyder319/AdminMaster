import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from '../admin_navbar/admin_navbar.component';
import { ReportesService } from '../services/reportes.service';

@Component({
  selector: 'app-reportes-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  templateUrl: './reportes-ventas.component.html',
  styleUrls: ['./reportes-ventas.component.scss']
})
export class ReportesVentasComponent {
  from = '';
  to = '';
  vista: 'producto' | 'categoria' = 'producto';

  porProducto: Array<{ productoId: number; nombreProducto: string; cantidadVendida: number; totalVendido: number }> = [];
  porCategoria: Array<{ categoriaId: number | null; nombreCategoria: string; cantidadVendida: number; totalVendido: number }> = [];
  cargando = false;

  constructor(private reportes: ReportesService) {}

  cargar() {
    this.cargando = true;
    const params = { from: this.from || undefined, to: this.to || undefined };

    if (this.vista === 'producto') {
      this.reportes.getVentasPorProducto(params).subscribe({
        next: (rows) => { this.porProducto = rows || []; this.cargando = false; },
        error: () => { this.porProducto = []; this.cargando = false; },
      });
    } else {
      this.reportes.getVentasPorCategoria(params).subscribe({
        next: (rows) => { this.porCategoria = rows || []; this.cargando = false; },
        error: () => { this.porCategoria = []; this.cargando = false; },
      });
    }
  }
}
