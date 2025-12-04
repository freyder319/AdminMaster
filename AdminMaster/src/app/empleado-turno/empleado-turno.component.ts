import { Component, Input, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { TurnoResumen, TurnosService, TurnoActivoItem } from '../services/turnos.service';
import { DatePipe, DecimalPipe, NgIf, NgClass, isPlatformBrowser } from '@angular/common';
import { forkJoin, of, timer } from 'rxjs';
import { catchError, switchMap, take, filter } from 'rxjs/operators';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import Swal from 'sweetalert2';
import { Router, NavigationEnd } from '@angular/router';
import { RouterModule } from '@angular/router';
import { TurnoStateService } from '../services/turno-state.service';
import { EmpleadosService } from '../services/empleados.service';
import { PqrsService } from '../services/pqrs.service';
import { HistoryService } from '../services/history.service';
import { TurnosDiaComponent } from './registro-turno/turnos-dia.component';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../config/environment';

@Component({
  selector: 'app-empleado-turno',
  imports: [NgIf, NgClass, DatePipe, DecimalPipe, AdminNavbarComponent, RouterModule, TurnosDiaComponent],
  templateUrl: './empleado-turno.component.html',
  styleUrls: ['./empleado-turno.component.scss']
})
export class EmpleadoTurnoComponent implements OnInit {
  @Input() empleadoId!: number;
  resumen!: TurnoResumen;
  sinTurnoActivo = false;
  cargando = false;
  isAdmin = false;
  isPuntoPos = false;
  showTurnosDia = true;
  activos: TurnoActivoItem[] = [];
  cerrados: TurnoActivoItem[] = [];

  // Contadores para el menú admin
  countActivos = 0;
  countCerrados = 0;
  countHistorial = 0;
  countNotificaciones = 0;

  constructor(
    private turnoService: TurnosService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private turnoState: TurnoStateService,
    private empleadosService: EmpleadosService,
    private pqrsService: PqrsService,
    private history: HistoryService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    // Evitar llamadas en SSR (no hay localStorage, no se adjunta token)
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const rol = (localStorage.getItem('rol') || '').trim().toLowerCase();
    try { this.turnoState.hydrateFromStorage(); } catch {}
    this.isAdmin = rol === 'admin';
    this.isPuntoPos = rol === 'punto_pos';
    if (this.isAdmin) {
      // Cargar contadores para las opciones del panel admin
      this.cargarContadoresAdmin();
      this.sincronizarVistaConRuta();
    } else {
      this.cargarEstado();
    }
  }

  private sincronizarVistaConRuta() {
    // Definir si mostramos Turnos del Día o el router-outlet según la ruta actual
    const actualizar = (url: string) => {
      if (!url.includes('/turno-empleado')) {
        return;
      }
      // Registros de turnos (vista principal)
      if (url.endsWith('/turno-empleado') || url.includes('/turno-empleado/registros-turno')) {
        this.showTurnosDia = true;
      } else {
        this.showTurnosDia = false;
      }
    };

    // Inicial
    actualizar(this.router.url);

    // Escuchar cambios de navegación
    this.router.events
      .pipe(filter(ev => ev instanceof NavigationEnd))
      .subscribe((ev) => {
        const nav = ev as NavigationEnd;
        actualizar(nav.urlAfterRedirects || nav.url);
      });
  }

  private cargarContadoresAdmin() {
    this.turnoService.getTurnosActivosPublic()
      .pipe(catchError(() => of([] as TurnoActivoItem[])))
      .subscribe(items => this.countActivos = (items || []).length);

    this.turnoService.getTurnosCerradosPublic()
      .pipe(catchError(() => of([] as TurnoActivoItem[])))
      .subscribe(items => this.countCerrados = (items || []).length);

    this.pqrsService.obtenerTodas()
      .pipe(catchError(() => of([] as any[])))
      .subscribe(items => this.countNotificaciones = (items || []).length);

    this.history.watchLatest()
      .pipe(take(1))
      .subscribe(items => {
        const list = (items as any[]) || [];
        this.countHistorial = list.filter(ev => (ev?.module || '').toLowerCase() !== 'pqrs').length;
      });
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
    this.turnoService.getTurnosActivosPublic()
      .pipe(
        switchMap((items) => this.enrichListWithNames(items)),
        switchMap((enrichedActivos) => {
          this.activos = enrichedActivos;
          // Pausa corta para aliviar rate-limit antes de la segunda llamada
          return timer(800).pipe(switchMap(() => this.turnoService.getTurnosCerradosPublic()));
        }),
        switchMap((cerr) => this.enrichListWithNames(cerr)),
      )
      .subscribe({
        next: (enrichedCerrados) => {
          this.cerrados = enrichedCerrados;
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al cargar turnos:', err);
          this.activos = this.activos || [];
          this.cerrados = this.cerrados || [];
          this.cargando = false;
        }
      });
  }

  private enrichListWithNames(list: TurnoActivoItem[]) {
    if (!Array.isArray(list) || list.length === 0) return of([] as TurnoActivoItem[]);
    const requests = list.map((it) => {
      if (!it?.usuarioId) return of(it);
      return this.empleadosService.getEmpleado(it.usuarioId).pipe(
        catchError(() => of(null)),
        // map inline without importing map separately
        switchMap((emp) => {
          const enriched: TurnoActivoItem = {
            ...it,
            nombre: (emp as any)?.nombre ?? it.nombre,
            apellido: (emp as any)?.apellido ?? it.apellido,
          };
          return of(enriched);
        })
      );
    });
    return forkJoin(requests);
  }
  private hoyIso(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private bloqueActualPorHora(): 'manana' | 'tarde' | 'noche' | null {
    const h = new Date().getHours();
    if (h >= 6 && h < 12) return 'manana';
    if (h >= 12 && h < 18) return 'tarde';
    if (h >= 18 && h <= 23) return 'noche';
    return null;
  }

  private obtenerRegistroTurnoIdActual() {
    const fecha = this.hoyIso();
    const bloque = this.bloqueActualPorHora();
    if (!bloque) {
      return of(undefined as number | undefined);
    }
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<any[]>(`${environment.apiUrl}/turno/registro`, { params }).pipe(
      catchError(() => of([] as any[])),
      // map inline usando switchMap para evitar importar map
      switchMap((items: any[]) => {
        if (!Array.isArray(items) || items.length === 0) {
          return of(undefined as number | undefined);
        }

        // Solo consideramos turnos en estado "por_cumplir" o "pendiente"
        const candidatos = items.filter(it =>
          it &&
          (it.estado === 'por_cumplir' || it.estado === 'pendiente')
        );

        if (candidatos.length === 0) {
          return of(undefined as number | undefined);
        }

        const ahora = new Date();
        const actualMin = ahora.getHours() * 60 + ahora.getMinutes();

        const match = candidatos.find(it => {
          if (!it || it.bloque !== bloque) {
            return false;
          }

          let desdeMin = 0;
          let hastaMin = 23 * 60 + 59;

          if (typeof it.horaDesde === 'string' && /^\d{2}:\d{2}$/.test(it.horaDesde)) {
            const [h, m] = it.horaDesde.split(':').map((v: string) => Number(v));
            if (Number.isFinite(h) && Number.isFinite(m)) {
              desdeMin = h * 60 + m;
            }
          }

          if (typeof it.horaHasta === 'string' && /^\d{2}:\d{2}$/.test(it.horaHasta)) {
            const [h, m] = it.horaHasta.split(':').map((v: string) => Number(v));
            if (Number.isFinite(h) && Number.isFinite(m)) {
              hastaMin = h * 60 + m;
            }
          }

          // Tolerancia de 5 minutos antes y después
          const tolerancia = 5;
          const desdeConTol = Math.max(0, desdeMin - tolerancia);
          const hastaConTol = Math.min(23 * 60 + 59, hastaMin + tolerancia);

          return actualMin >= desdeConTol && actualMin <= hastaConTol;
        });

        return of(match && match.id ? Number(match.id) : undefined);
      })
    );
  }

  iniciarTurno() {
    Swal.fire({
      title: 'Iniciar turno',
      text: 'Ingresa el Monto Inicial de Caja',
      input: 'number',
      inputAttributes: { min: '50000', step: '1000' },
      inputValue: 50000,
      showCancelButton: true,
      confirmButtonText: 'Iniciar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1d4ed8',
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'swal2-rounded',
        confirmButton: 'swal2-confirm-primary',
        cancelButton: 'swal2-cancel-muted',
      },
    }).then((result) => {
      if (!result.isConfirmed) return;
      const monto = Number(result.value ?? 0);
      if (isNaN(monto) || monto < 50000) {
        Swal.fire({
          icon: 'warning',
          title: 'Monto inicial inválido',
          html: 'La <b>Caja</b> debe iniciar con al menos <b>$50.000</b>. Ingresa un <b>Monto Inicial</b> igual o superior a $50.000.',
          confirmButtonText: 'Corregir monto',
          confirmButtonColor: '#1d4ed8',
        });
        return;
      }

      this.obtenerRegistroTurnoIdActual().subscribe((registroTurnoId) => {
        if (typeof registroTurnoId !== 'number' || isNaN(registroTurnoId)) {
          Swal.fire({
            icon: 'warning',
            title: 'No puedes Iniciar el Turno',
            html: 'No Existe un <b>Turno Registrado</b> para la <b>Fecha</b> y el <b>Horario Actual</b>. Verifica con el <b>Administrador</b>.',
          });
          return;
        }
        this.turnoService.iniciarTurno(monto, undefined, registroTurnoId).subscribe({
          next: (data) => {
            this.resumen = data;
            this.sinTurnoActivo = false;
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Turno Iniciado', timer: 2000, showConfirmButton: false });
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
                this.turnoService.iniciarTurnoPorUsuario(userId, monto, undefined, registroTurnoId).subscribe({
                  next: (data2) => {
                    this.resumen = data2;
                    this.sinTurnoActivo = false;
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Turno Iniciado', timer: 2000, showConfirmButton: false });
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
    });
  }

  cerrarTurno() {
    Swal.fire({
      title: 'Terminar turno',
      text: 'Ingresa el Monto final de Caja',
      input: 'number',
      inputAttributes: { min: '0', step: '1' },
      inputValue: 0,
      showCancelButton: true,
      confirmButtonText: 'Terminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1d4ed8',
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'swal2-rounded',
        confirmButton: 'swal2-confirm-primary',
        cancelButton: 'swal2-cancel-muted',
      },
    }).then((result) => {
      if (!result.isConfirmed) return;
      const monto = Number(result.value ?? 0);
      if (!Number.isFinite(monto) || monto <= 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Monto final inválido',
          html: 'La <b>Caja</b> no puede terminar en $0. Ingresa el <b>Monto Final</b> real de Efectivo al cerrar el Turno (mayor que 0).',
          confirmButtonText: 'Corregir monto',
          confirmButtonColor: '#1d4ed8',
        });
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
