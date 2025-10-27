import { Component, Input, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { TurnoResumen, TurnosService, TurnoActivoItem } from '../services/turnos.service';
import { DatePipe, DecimalPipe, NgIf, NgFor, isPlatformBrowser } from '@angular/common';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { TurnoStateService } from '../services/turno-state.service';

@Component({
  selector: 'app-empleado-turno',
  imports: [NgIf, NgFor, DatePipe, DecimalPipe, AdminNavbarComponent],
  templateUrl: './empleado-turno.component.html',
  styleUrls: ['./empleado-turno.component.scss']
})
export class EmpleadoTurnoComponent implements OnInit {
  @Input() empleadoId!: number;
  resumen!: TurnoResumen;
  sinTurnoActivo = false;
  cargando = false;
  isAdmin = false;
  activos: TurnoActivoItem[] = [];
  cerrados: TurnoActivoItem[] = [];
  modalAbierto = false;
  seleccionado: TurnoActivoItem | null = null;

  constructor(private turnoService: TurnosService, @Inject(PLATFORM_ID) private platformId: Object, private router: Router, private turnoState: TurnoStateService) {}

  ngOnInit(): void {
    // Evitar llamadas en SSR (no hay localStorage, no se adjunta token)
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const rol = (localStorage.getItem('rol') || '').trim().toLowerCase();
    try { this.turnoState.hydrateFromStorage(); } catch {}
    this.isAdmin = rol === 'admin';
    if (this.isAdmin) {
      this.cargarActivos();
    } else {
      this.cargarEstado();
    }
  }

  private cargarEstado() {
    this.cargando = true;
    // Si hay estado persistido, mostrar inmediatamente un resumen básico
    const snap = this.turnoState.snapshot;
    if (snap) {
      try {
        this.resumen = {
          turno: {
            inicioTurno: new Date(snap.inicioTurno) as any,
            finTurno: undefined as any,
            observaciones: snap.observaciones || undefined,
          },
          aperturaCaja: undefined as any,
          cierreCaja: undefined as any,
          actividad: { totalVentas: 0, transacciones: 0 } as any,
        } as any;
        this.sinTurnoActivo = false;
        // Mostrar de inmediato sin esperar al backend
        this.cargando = false;
      } catch {}
    }
    if (this.empleadoId) {
      this.turnoService.getResumenTurno(this.empleadoId).subscribe({
        next: (data) => {
          this.resumen = data;
          this.sinTurnoActivo = false;
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al cargar resumen de turno:', err);
          if (!snap) { // solo marcar sin turno si no había persistencia
            this.sinTurnoActivo = true;
            this.resumen = undefined as any;
          }
          this.cargando = false;
        },
      });
    } else {
      this.turnoService.getTurnoActivo().subscribe({
        next: (data) => {
          this.resumen = data;
          this.sinTurnoActivo = false;
          this.cargando = false;
        },
        error: (err) => {
          if (err?.status === 401) {
            // Mantener al usuario en la vista para evitar rebote al login
            if (!snap) {
              this.sinTurnoActivo = true;
              this.resumen = undefined as any;
            }
          } else if (err?.status === 404) {
            if (!snap) {
              this.sinTurnoActivo = true;
              this.resumen = undefined as any;
            }
          } else {
            console.error('Error al cargar turno activo:', err);
          }
          this.cargando = false;
        },
      });
    }
  }

  private cargarActivos() {
    this.cargando = true;
    this.turnoService.getTurnosActivosPublic().subscribe({
      next: (items) => {
        this.activos = items;
        // luego cerrados
        this.turnoService.getTurnosCerradosPublic().subscribe({
          next: (cerr) => {
            this.cerrados = cerr;
            this.cargando = false;
          },
          error: (err2) => {
            console.error('Error al cargar turnos cerrados:', err2);
            this.cerrados = [];
            this.cargando = false;
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar turnos activos:', err);
        this.activos = [];
        // intentar al menos cargar cerrados
        this.turnoService.getTurnosCerradosPublic().subscribe({
          next: (cerr) => {
            this.cerrados = cerr;
            this.cargando = false;
          },
          error: (err2) => {
            console.error('Error al cargar turnos cerrados:', err2);
            this.cerrados = [];
            this.cargando = false;
          }
        });
      }
    });
  }

  abrirDetalle(item: TurnoActivoItem) {
    this.seleccionado = item;
    this.modalAbierto = true;
  }

  cerrarDetalle() {
    this.modalAbierto = false;
    this.seleccionado = null;
  }
 
  iniciarTurno() {
    Swal.fire({
      title: 'Iniciar turno',
      text: 'Ingresa el monto inicial de caja',
      input: 'number',
      inputAttributes: { min: '0', step: '0.01' },
      inputValue: 0,
      showCancelButton: true,
      confirmButtonText: 'Iniciar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;
      const monto = Number(result.value ?? 0);
      if (isNaN(monto) || monto < 0) {
        Swal.fire({ icon: 'warning', title: 'Monto inválido', text: 'Debes ingresar un número mayor o igual a 0.' });
        return;
      }
      this.turnoService.iniciarTurno(monto).subscribe({
        next: (data) => {
          this.resumen = data;
          this.sinTurnoActivo = false;
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Turno iniciado', timer: 2000, showConfirmButton: false });
          // persistir estado de turno activo
          const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
          const usuarioId = userIdStr ? Number(userIdStr) : NaN;
          this.turnoState.setActivo({
            inicioTurno: String(this.resumen?.turno?.inicioTurno || new Date().toISOString()),
            observaciones: this.resumen?.turno?.observaciones || null,
            usuarioId: Number.isFinite(usuarioId) ? usuarioId : 0,
          });
        },
        error: (err) => {
          console.error('No se pudo iniciar el turno', err);
          const msg = (err?.error && (err.error.message || err.error.error)) || 'Intenta nuevamente.';
          if (err?.status === 401) {
            // Fallback público sin JWT usando userId guardado en login
            const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
            const userId = userIdStr ? Number(userIdStr) : NaN;
            if (!isNaN(userId) && userId > 0) {
              this.turnoService.iniciarTurnoPorUsuario(userId, monto).subscribe({
                next: (data2) => {
                  this.resumen = data2;
                  this.sinTurnoActivo = false;
                  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Turno iniciado', timer: 2000, showConfirmButton: false });
                  this.turnoState.setActivo({
                    inicioTurno: String(this.resumen?.turno?.inicioTurno || new Date().toISOString()),
                    observaciones: this.resumen?.turno?.observaciones || null,
                    usuarioId: Number.isFinite(userId) ? userId : 0,
                  });
                },
                error: (err2) => {
                  console.error('Fallback público falló', err2);
                  Swal.fire({ icon: 'error', title: 'No se pudo iniciar el turno', text: (err2?.error && (err2.error.message || err2.error.error)) || msg });
                },
              });
              return;
            }
            Swal.fire({ icon: 'error', title: 'Sesión expirada', text: 'Vuelve a iniciar sesión.' });
            try { localStorage.removeItem('token'); localStorage.removeItem('rol'); } catch {}
            this.router.navigate(['/login']);
            return;
          }
          if (err?.status === 400 || err?.status === 409) {
            Swal.fire({ icon: 'warning', title: 'No se pudo iniciar el turno', text: msg });
          } else {
            Swal.fire({ icon: 'error', title: 'Error al iniciar turno', text: msg });
          }
        },
      });
    });
  }

  cerrarTurno() {
    Swal.fire({
      title: 'Terminar turno',
      text: 'Ingresa el monto final de caja',
      input: 'number',
      inputAttributes: { min: '0', step: '1' },
      inputValue: 0,
      showCancelButton: true,
      confirmButtonText: 'Terminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;
      const monto = Number(result.value ?? 0);
      if (!Number.isFinite(monto) || monto < 0) {
        Swal.fire({ icon: 'warning', title: 'Monto inválido', text: 'Debes ingresar un número mayor o igual a 0.' });
        return;
      }
      this.turnoService.cerrarTurno(monto).subscribe({
        next: (data) => {
          this.resumen = undefined as any;
          this.sinTurnoActivo = true;
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Turno cerrado', timer: 2000, showConfirmButton: false });
          // limpiar indicador persistente al cerrar turno
          try { this.turnoState.clear(); } catch {}
        },
        error: (err) => {
          const msg = (err?.error && (err.error.message || err.error.error)) || 'Intenta nuevamente.';
          if (err?.status === 400) {
            Swal.fire({ icon: 'warning', title: 'No se pudo cerrar el turno', text: msg });
          } else if (err?.status === 401) {
            // Fallback público sin JWT usando userId guardado en login
            const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
            const userId = userIdStr ? Number(userIdStr) : NaN;
            if (!isNaN(userId) && userId > 0) {
              this.turnoService.cerrarTurnoPorUsuario(userId, monto).subscribe({
                next: (data2) => {
                  this.resumen = undefined as any;
                  this.sinTurnoActivo = true;
                  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Turno cerrado', timer: 2000, showConfirmButton: false });
                  try { this.turnoState.clear(); } catch {}
                },
                error: (err2) => {
                  console.error('Fallback público de cierre falló', err2);
                  Swal.fire({ icon: 'error', title: 'No se pudo cerrar el turno', text: (err2?.error && (err2.error.message || err2.error.error)) || msg });
                },
              });
              return;
            }
            Swal.fire({ icon: 'error', title: 'Sesión expirada', text: 'Vuelve a iniciar sesión.' });
            try { localStorage.removeItem('token'); localStorage.removeItem('rol'); } catch {}
            this.router.navigate(['/login']);
          } else {
            Swal.fire({ icon: 'error', title: 'Error al cerrar turno', text: msg });
          }
        }
      });
    });
  }
}

