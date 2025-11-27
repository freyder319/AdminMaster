import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, NgFor, NgIf, isPlatformBrowser } from '@angular/common';
import { AdminNavbarComponent } from '../admin_navbar/admin_navbar.component';
import { TurnosService, TurnoResumen } from '../services/turnos.service';

@Component({
  selector: 'app-actividad-empleado',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, DatePipe, DecimalPipe, AdminNavbarComponent],
  templateUrl: './actividad-empleado.component.html',
  styleUrls: ['./actividad-empleado.component.scss']
})
export class ActividadEmpleadoComponent implements OnInit {
  resumen: TurnoResumen | null = null;
  cargando = false;
  error: string | null = null;

  expandedVentaId: number | null = null;
  expandedVentaLibreId: number | null = null;

  constructor(
    private turnosService: TurnosService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.cargarActividad();
  }

  cargarActividad(): void {
    this.cargando = true;
    this.error = null;
    this.turnosService.getTurnoActivo().subscribe({
      next: (res) => {
        this.resumen = res;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        if (err?.status === 404) {
          this.resumen = null;
          this.error = 'No tienes un turno activo en este momento.';
        } else if (err?.status === 401) {
          this.resumen = null;
          this.error = 'Sesión no autorizada o expirada. Inicia sesión nuevamente.';
        } else {
          this.resumen = null;
          const msg = (err?.error && (err.error.message || err.error.error)) || 'No se pudo cargar la actividad del turno.';
          this.error = msg;
        }
      },
    });
  }

  toggleVentaDetalle(id: number): void {
    this.expandedVentaId = this.expandedVentaId === id ? null : id;
  }

  toggleVentaLibreDetalle(id: number): void {
    this.expandedVentaLibreId = this.expandedVentaLibreId === id ? null : id;
  }
}
