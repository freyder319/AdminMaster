import { Component, Input, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { TurnoResumen, TurnosService, TurnoActivoItem } from '../services/turnos.service';
import { DatePipe, DecimalPipe, NgIf, NgFor, NgClass, JsonPipe, KeyValuePipe, isPlatformBrowser } from '@angular/common';
import { forkJoin, of, Subscription, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { TurnoStateService } from '../services/turno-state.service';
import { EmpleadosService } from '../services/empleados.service';
import { PqrsService } from '../services/pqrs.service';
import { HistoryService, AuditLogDto } from '../services/history.service';

@Component({
  selector: 'app-empleado-turno',
  imports: [NgIf, NgFor, DatePipe, DecimalPipe, JsonPipe, KeyValuePipe, AdminNavbarComponent, RouterModule],
  templateUrl: './empleado-turno.component.html',
  styleUrls: ['./empleado-turno.component.scss']
})
export class EmpleadoTurnoComponent implements OnInit, OnDestroy {
  @Input() empleadoId!: number;
  resumen!: TurnoResumen;
  sinTurnoActivo = false;
  cargando = false;
  isAdmin = false;
  activos: TurnoActivoItem[] = [];
  cerrados: TurnoActivoItem[] = [];
  modalAbierto = false;
  seleccionado: TurnoActivoItem | null = null;
  seleccionadoCajaCodigo: string | null = null;
  // vista actual para ADMIN: 'activos' | 'cerrados' | 'notificaciones'
  vista: 'activos' | 'cerrados' | 'notificaciones' | 'historial' = 'activos';
  // Placeholder de notificaciones (PQRS) hasta tener endpoint GET
  notificaciones: Array<{ nombre?: string; apellido?: string; correo?: string; numero?: string; comentarios?: string; fecha?: string; }> = [];
  // Estado para detalle de PQRS
  pqrsModalAbierto = false;
  pqrsSeleccionado: { nombre?: string; apellido?: string; correo?: string; numero?: string; comentarios?: string; fecha?: string; } | null = null;
  // Historial en tiempo casi real
  historyItems: AuditLogDto[] = [];
  private historySub?: Subscription;
  historyModalAbierto = false;
  historySeleccionado: AuditLogDto | null = null;

  constructor(
    private turnoService: TurnosService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private turnoState: TurnoStateService,
    private empleadosService: EmpleadosService,
    private pqrsService: PqrsService,
    private history: HistoryService,
  ) {}

  ngOnInit(): void {
    // Evitar llamadas en SSR (no hay localStorage, no se adjunta token)
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const rol = (localStorage.getItem('rol') || '').trim().toLowerCase();
    try { this.turnoState.hydrateFromStorage(); } catch {}
    this.isAdmin = rol === 'admin';
    if (this.isAdmin) {
      // La carga por vista se realiza en componentes hijos via rutas
    } else {
      this.cargarEstado();
    }
  }

  abrirDetalleHistorial(ev: AuditLogDto) {
    this.historySeleccionado = ev;
    this.historyModalAbierto = true;
  }

  cerrarDetalleHistorial() {
    this.historyModalAbierto = false;
    this.historySeleccionado = null;
  }

  // Utilidad para renderizar detalles como lista si es objeto plano
  isObject(val: any): val is Record<string, any> {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  }

  private isImageLike(val: any): boolean {
    if (typeof val !== 'string') return false;
    if (val.startsWith('data:image')) return true;
    return val.length > 200; // evitar blobs/base64 largos
  }

  private shouldIgnoreKey(key: string): boolean {
    const k = (key || '').toLowerCase();
    return ['imagen','image','foto','photo','img','imgproducto','picture','logo','icon','avatar'].includes(k);
  }

  // Ocultar campos poco útiles (ids y técnicos) en diffs/fallback
  shouldSkipDiffKey(key: string): boolean {
    const k = (key || '').toLowerCase();
    if (this.shouldIgnoreKey(k)) return true;
    if (k === 'id' || k === 'entidadid' || k === 'usuarioid' || k === 'actoruserid') return true;
    if (k === 'ruta' || k === 'ip' || k === 'createdat' || k === 'updatedat' || k === 'fecha') return true;
    if (k.endsWith('id')) return true;
    return false;
  }

  sanitizeValue(val: any): any {
    if (this.isImageLike(val)) return '[imagen omitida]';
    if (this.isObject(val)) return JSON.stringify(val);
    return val;
  }

  // Construye lista de diffs si hay before/after o changes
  buildDiff(details: any): Array<{ field: string; before: any; after: any }> | null {
    try {
      if (!details) return null;
      // Caso 1: details.before / details.after
      if (this.isObject(details.before) && this.isObject(details.after)) {
        const before = details.before as Record<string, any>;
        const after = details.after as Record<string, any>;
        const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
        const out: Array<{ field: string; before: any; after: any }> = [];
        for (const key of keys) {
          if (this.shouldSkipDiffKey(key)) continue;
          const b = before[key];
          const a = after[key];
          const bSan = this.sanitizeValue(b);
          const aSan = this.sanitizeValue(a);
          if (JSON.stringify(bSan) !== JSON.stringify(aSan)) {
            out.push({ field: key, before: bSan, after: aSan });
          }
        }
        return out.length ? out : null;
      }
      // Caso 2: details.changes: { campo: {before, after} }
      if (this.isObject(details.changes)) {
        const out: Array<{ field: string; before: any; after: any }> = [];
        for (const [key, val] of Object.entries(details.changes)) {
          if (this.shouldSkipDiffKey(key)) continue;
          const b = (val as any)?.before;
          const a = (val as any)?.after;
          const bSan = this.sanitizeValue(b);
          const aSan = this.sanitizeValue(a);
          if (JSON.stringify(bSan) !== JSON.stringify(aSan)) {
            out.push({ field: key, before: bSan, after: aSan });
          }
        }
        return out.length ? out : null;
      }
    } catch {}
    return null;
  }

  // Obtener nombre de categoría desde details (after.nombre | changes.nombre.after | nombre)
  getCategoryName(details: any): string | null {
    try {
      const name = details?.after?.nombre ?? details?.changes?.nombre?.after ?? details?.nombre ?? null;
      return name || null;
    } catch {
      return null;
    }
  }

  ngOnDestroy(): void {
    try { this.historySub?.unsubscribe(); } catch {}
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

  abrirDetalle(item: TurnoActivoItem) {
    this.seleccionado = item;
    this.seleccionadoCajaCodigo = null;
    // Cargar el empleado para obtener su caja asignada
    if (item?.usuarioId) {
      this.empleadosService.getEmpleado(item.usuarioId).subscribe({
        next: (emp) => {
          this.seleccionadoCajaCodigo = emp?.caja?.codigoCaja || null;
        },
        error: () => {
          this.seleccionadoCajaCodigo = null;
        }
      });
    }
    this.modalAbierto = true;
  }

  cerrarDetalle() {
    this.modalAbierto = false;
    this.seleccionado = null;
    this.seleccionadoCajaCodigo = null;
  }

  abrirDetallePqrs(n: { nombre?: string; apellido?: string; correo?: string; numero?: string; comentarios?: string; fecha?: string; }) {
    try { console.log('abrirDetallePqrs click', n); } catch {}
    this.pqrsSeleccionado = n;
    this.pqrsModalAbierto = true;
  }

  cerrarDetallePqrs() {
    try { console.log('cerrarDetallePqrs'); } catch {}
    this.pqrsModalAbierto = false;
    this.pqrsSeleccionado = null;
  }

  // Cambiar vista en ADMIN
  setVista(v: 'activos' | 'cerrados' | 'notificaciones' | 'historial') {
    this.vista = v;
    if (v === 'notificaciones' && (!this.notificaciones || this.notificaciones.length === 0)) {
      this.cargarNotificaciones();
    }
    if (v === 'historial') {
      // iniciar suscripción si no existe
      if (!this.historySub) {
        this.historySub = this.history.watchLatest().subscribe(items => {
          this.historyItems = (items || []).filter(ev => (ev?.module || '').toLowerCase() !== 'pqrs');
        });
      }
    }
  }

  private cargarNotificaciones() {
    this.cargando = true;
    this.pqrsService.obtenerTodas().pipe(
      catchError((err) => {
        console.error('Error al cargar PQRS:', err);
        return of([]);
      })
    ).subscribe((items: any[]) => {
      // Normalizar campos esperados en la UI
      this.notificaciones = (items || []).map((it: any) => ({
        nombre: it?.nombre,
        apellido: it?.apellido,
        correo: it?.correo,
        numero: it?.numero,
        comentarios: it?.comentarios,
        fecha: it?.creadoEn || it?.createdAt || it?.fecha || null,
      }));
      this.cargando = false;
    });
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

  // Traducir acciones del historial al español
  tAction(action: string | null | undefined): string {
    const a = (action || '').toLowerCase();
    switch (a) {
      case 'create': return 'crear';
      case 'update': return 'modificar';
      case 'delete': return 'eliminar';
      case 'open': return 'apertura';
      case 'close': return 'cierre';
      default: return a || '';
    }
  }

  // Traducir módulos al español para mostrar en UI
  tModule(mod: string | null | undefined): string {
    const m = (mod || '').toLowerCase();
    switch (m) {
      case 'cliente': return 'Clientes';
      case 'proveedor': return 'Proveedores';
      case 'empleado': return 'Empleados';
      case 'venta': return 'Ventas';
      case 'venta-libre': return 'Ventas libres';
      case 'caja': return 'Cajas';
      case 'gasto': return 'Gastos';
      case 'pqrs': return 'PQRS';
      case 'configuracion': return 'Configuración';
      case 'descuento': return 'Descuentos';
      case 'report': return 'Reportes';
      case 'producto': return 'Productos';
      case 'categoria': return 'Categorías';
      default: return mod || '';
    }
  }
}
