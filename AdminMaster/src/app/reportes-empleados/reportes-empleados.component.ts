import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from '../admin_navbar/admin_navbar.component';
import { ReportesService } from '../services/reportes.service';
import { EmpleadosService, Empleados } from '../services/empleados.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-reportes-empleados',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  templateUrl: './reportes-empleados.component.html',
  styleUrls: ['./reportes-empleados.component.scss']
})
export class ReportesEmpleadosComponent {
  from = '';
  to = '';
  filas: Array<{
    usuarioId: number;
    nombre: string;
    totalVentas: number;
    cantidadVentas: number;
    horasTrabajadas: number;
  }> = [];
  cargando = false;

  constructor(
    private reportes: ReportesService,
    private empleadosService: EmpleadosService,
  ) {}

  cargar() {
    this.cargando = true;
    forkJoin({
      ventas: this.reportes.getVentasPorEmpleado({ from: this.from || undefined, to: this.to || undefined }),
      horas: this.reportes.getHorasPorEmpleado({ from: this.from || undefined, to: this.to || undefined }),
      empleados: this.empleadosService.getEmpleados(),
    })
      .pipe(catchError(() => of({ ventas: [], horas: [], empleados: [] } as any)))
      .subscribe(({ ventas, horas, empleados }) => {
        const mapHoras = new Map((horas as { usuarioId: number; horasTrabajadas: number }[]).map((h) => [h.usuarioId, h.horasTrabajadas]));
        const mapEmp = new Map((empleados as Empleados[]).map(e => [e.id, e]));

        this.filas = (ventas as { usuarioId: number; cantidadVentas: number; totalVentas: number }[] || []).map((v) => {
          const emp = mapEmp.get(v.usuarioId);
          const nombre = emp ? `${emp.nombre} ${emp.apellido}` : `Usuario ${v.usuarioId}`;
          return {
            usuarioId: v.usuarioId,
            nombre,
            totalVentas: v.totalVentas,
            cantidadVentas: v.cantidadVentas,
            horasTrabajadas: mapHoras.get(v.usuarioId) || 0,
          };
        });
        this.cargando = false;
      });
  }
}
