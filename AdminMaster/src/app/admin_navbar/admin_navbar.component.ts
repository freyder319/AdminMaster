import { NgIf } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import Swal from 'sweetalert2';
import { TurnosService } from '../services/turnos.service';
import { TurnoStateService, TurnoActivoState } from '../services/turno-state.service';
import { Observable } from 'rxjs';
import { ConfiguracionService, ConfiguracionNegocio } from '../services/configuracion.service';

@Component({
  selector: 'app-admin-navbar',
  imports: [RouterModule, NgIf],
  templateUrl: './admin_navbar.component.html',
  styleUrls: ['./admin_navbar.component.scss']
})

export class AdminNavbarComponent {
  correo: string | null = null;
  rol: string | null = null;
  turno$!: Observable<TurnoActivoState | null>;
  showTurnMenu = false;
  selectedGroup: 'cuenta' | 'turnos' | 'operaciones' | 'reportes' | 'relaciones' | 'cajas' | 'ia' = 'operaciones';
  isMobilePanelOpen = false;
  isMobileView = false;
  mobileGroupsExpanded = {
    cuenta: false,
    turnos: false,
    operaciones: false,
    reportes: false,
    relaciones: false,
    cajas: false,
    ia: false,
  } as const;
  searchPreviewLabel: string | null = null;
  searchFeedbackTerm: string | null = null;
  logoUrl: string | null = null;
  turnoActivo: boolean = false;

  constructor(
    private router: Router,
    private turnosService: TurnosService,
    private turnoState: TurnoStateService,
    private cfgSvc: ConfiguracionService,
  ) {}

  cerrarSesion(): void {
    const turnoActivo = this.turnoState.snapshot;
    const isAdmin = ((this.rol || localStorage.getItem('rol') || '').toLowerCase() === 'admin');
    if (turnoActivo && !isAdmin) {
      Swal.fire({
        icon: 'warning',
        title: 'Turno activo',
        html: 'No puedes cerrar sesión mientras haya un turno activo. Por favor, cierra el turno primero.',
        confirmButtonText: 'Ir a Turno',
        confirmButtonColor: '#0d6efd'
      }).then(() => {
        this.router.navigate(['/turno-empleado']);
      });
      return;
    }

    const rol = localStorage.getItem('rol') ?? 'usuario';
    const rolTexto = {
      admin: 'Administrador',
      punto_pos: 'Punto de Venta'
    }[rol] ?? rol;

    Swal.fire({
      title: '¿Cerrar Sesión?',
      html: `Tu Sesión como <strong>${rolTexto}</strong> se Cerrará`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Salir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then(result => {
      if (!result.isConfirmed) return;

      localStorage.clear();
      this.router.navigate(['/login']);
      Swal.fire({
        icon: 'success',
        title: 'Sesión Cerrada',
        html: `¡Hasta Pronto, <strong>${rolTexto}</strong>!`,
        timer: 2000,
        showConfirmButton: false
      });
    });
  }

  toggleMobileGroup(group: 'cuenta' | 'turnos' | 'operaciones' | 'reportes' | 'relaciones' | 'cajas'| 'ia') {
    // Solo aplica en vista móvil; en escritorio las secciones siempre están abiertas
    if (!this.isMobileView && (this.rol || '').toLowerCase() === 'admin') {
      return;
    }
    const current = (this.mobileGroupsExpanded as any)[group];
    (this.mobileGroupsExpanded as any)[group] = !current;
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
  }

  ngOnInit() {
    this.isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
    this.correo = localStorage.getItem('correo');
    const rawRol = localStorage.getItem('rol');
    this.rol = rawRol ? rawRol.toLowerCase() : null;
    try { this.turnoState.hydrateFromStorage(); } catch {}
    this.turno$ = this.turnoState.turnoActivo$;
    
    // Suscribirse al estado del turno para actualizar turnoActivo
    this.turno$.subscribe(turno => {
      this.turnoActivo = turno !== null;
    });

    // Cargar logo de configuración
    this.cfgSvc.get().subscribe({
      next: (cfg: ConfiguracionNegocio | null) => {
        this.logoUrl = cfg?.logoUrl ?? null;
      },
      error: () => {
        this.logoUrl = null;
      }
    });

    // Sincronizar el grupo de la navbar con la ruta actual
    this.syncGroupWithUrl(this.router.url || '');

    this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd) {
        this.syncGroupWithUrl(ev.urlAfterRedirects || ev.url || '');
        // En móvil, cerrar el panel después de navegar
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          this.isMobilePanelOpen = false;
        }
      }
    });
  }

  private findSearchCommands(q: string): { label: string; commands: any[] } | null {
    const entries: { keywords: string[]; commands: any[]; label: string }[] = [
      { keywords: ['movimiento', 'movimientos', 'inicio', 'dashboard'], commands: ['/movimientos'], label: 'Movimientos' },
      { keywords: ['estadistica', 'estadísticas', 'estadisticas', 'graficos', 'gráficos'], commands: ['/estadisticas'], label: 'Estadísticas' },
      { keywords: ['reporte empleado', 'reportes empleados', 'empleados reporte'], commands: ['/reportes-empleados'], label: 'Reportes empleados' },
      { keywords: ['reporte venta', 'reportes ventas', 'ventas reporte'], commands: ['/reportes-ventas'], label: 'Reportes ventas' },
      { keywords: ['caja', 'cajas'], commands: ['/cajas'], label: 'Cajas' },
      { keywords: ['auditoria', 'auditoría', 'auditoria caja', 'auditoría caja'], commands: ['/turno-empleado', 'auditoria-caja'], label: 'Auditoría de caja' },
      { keywords: ['turno', 'turnos'], commands: ['/turno-empleado', 'registros-turno'], label: 'Turnos (registro)' },
      { keywords: ['historial'], commands: ['/turno-empleado', 'historial'], label: 'Historial de turnos' },
      { keywords: ['pqrs', 'notificacion', 'notificaciones'], commands: ['/turno-empleado', 'notificaciones'], label: 'PQRS / Notificaciones' },
      { keywords: ['inventario', 'stock', 'productos'], commands: ['/inventario'], label: 'Inventario' },
      { keywords: ['venta', 'ventas', 'crear venta'], commands: ['/crear_venta'], label: 'Crear venta' },
      { keywords: ['actividad', 'actividad empleado'], commands: ['/actividad-empleado'], label: 'Actividad empleado' },
      { keywords: ['promocion', 'promoción', 'promociones', 'ofertas'], commands: ['/promociones'], label: 'Promociones' },
      { keywords: ['perfil', 'cuenta', 'configuracion', 'configuración'], commands: ['/perfil_administrador'], label: 'Perfil administrador' },
      { keywords: ['clientes', 'cliente'], commands: ['/clientes'], label: 'Clientes' },
      { keywords: ['proveedor', 'proveedores'], commands: ['/proveedor'], label: 'Proveedores' },
      { keywords: ['empleado', 'empleados'], commands: ['/empleados'], label: 'Empleados' },
    ];

    // Filtrar entradas según el rol del usuario
    const userRole = (this.rol || '').toLowerCase();
    const filteredEntries = entries.filter(entry => {
      if (userRole === 'admin') {
        // Si es admin, excluir las entradas relacionadas con ventas (crear_venta)
        return !entry.commands.includes('/crear_venta');
      } else if (userRole === 'punto_pos') {
        // Si es punto_pos, solo mostrar: ventas, actividad empleado, clientes y turno empleado
        const allowedCommands = ['/crear_venta', '/actividad-empleado', '/clientes', '/turno-empleado'];
        return allowedCommands.some(cmd => entry.commands.includes(cmd)) || 
               entry.commands.some(cmd => cmd.startsWith('/turno-empleado'));
      }
      return true;
    });

    for (const entry of filteredEntries) {
      if (entry.keywords.some(k => q.includes(k))) {
        return { label: entry.label, commands: entry.commands };
      }
    }
    return null;
  }

  onSearchChange(term: string): void {
    const q = (term || '').trim().toLowerCase();
    if (!q) {
      this.searchPreviewLabel = null;
      this.searchFeedbackTerm = null;
      return;
    }
    const result = this.findSearchCommands(q);
    if (result) {
      this.searchPreviewLabel = result.label;
      this.searchFeedbackTerm = null;
    } else {
      this.searchPreviewLabel = null;
      this.searchFeedbackTerm = term;
    }
  }

  private syncGroupWithUrl(url: string) {
    const u = (url || '').toLowerCase();
    
    // Rutas de Cajas (verificar primero para evitar conflictos)
    if (
      u.includes('/turno-empleado/auditoria-caja') ||
      u.includes('/cajas')
    ) {
      this.selectedGroup = 'cajas';
      return;
    }
    
    // Rutas de Turnos (después de verificar cajas)
    if (
      u.includes('/turno-empleado')
    ) {
      this.selectedGroup = 'turnos';
      return;
    }

    // Rutas de Cuenta (perfil u otras vistas de cuenta)
    if (
      u.includes('/perfil_administrador')
    ) {
      this.selectedGroup = 'cuenta';
      return;
    }

    // Rutas de Operaciones
    if (
      u.includes('/movimientos') ||
      u.includes('/inventario') ||
      u.includes('/promociones') ||
      u.includes('/crear_venta')
    ) {
      this.selectedGroup = 'operaciones';
      return;
    }

    // Rutas de Reportes
    if (
      u.includes('/estadisticas') ||
      u.includes('/reportes-empleados') ||
      u.includes('/reportes-ventas')
    ) {
      this.selectedGroup = 'reportes';
      return;
    }

    // Rutas de Relaciones
    if (
      u.includes('/proveedor') ||
      u.includes('/clientes') ||
      u.includes('/empleados')
    ) {
      this.selectedGroup = 'relaciones';
      return;
    }


    // Rutas de Inteligencia Artificial
    if (
      u.includes('/agente-ia') ||
      u.includes('/formulario-dinamico')
    ) {
      this.selectedGroup = 'ia';
      return;
    }
  }

  onPerfilClick() {
    const role = (this.rol || '').toLowerCase();
    if (role === 'admin') {
      this.toggleTurnMenu();
    } else {
      this.router.navigate(['/turno-empleado']);
    }
  }

  toggleTurnMenu() {
    if ((this.rol || '').toLowerCase() !== 'admin') {
      return;
    }
    this.showTurnMenu = !this.showTurnMenu;
  }

  selectGroup(group: 'cuenta' | 'turnos' | 'operaciones' | 'reportes' | 'relaciones' | 'cajas'| 'ia') {
    this.selectedGroup = group;
    if (group !== 'cuenta') {
      this.showTurnMenu = false;
    }
  }

  isPuntoPos(): boolean {
    return (this.rol || '').toLowerCase() === 'punto_pos';
  }

  irAOpcionTurno(segmento: string | null) {
    if ((this.rol || '').toLowerCase() !== 'admin') {
      return;
    }
    const commands = segmento ? ['/turno-empleado', segmento] : ['/turno-empleado'];
    this.router.navigate(commands);
    this.showTurnMenu = false;
  }

  onSearch(term: string): void {
    const q = (term || '').trim().toLowerCase();
    if (!q) return;
    const result = this.findSearchCommands(q);
    if (result) {
      this.router.navigate(result.commands as any[]);
      this.searchPreviewLabel = result.label;
      this.searchFeedbackTerm = null;
    } else {
      this.searchPreviewLabel = null;
      this.searchFeedbackTerm = term;
    }
  }

  onRailClick(): void {
    if (this.rol === 'admin') {
      // Solo para admin: navegar a movimientos
      this.router.navigate(['/movimientos']);
    } else {
      // Para otros roles: solo toggle del panel móvil
      this.isMobilePanelOpen = !this.isMobilePanelOpen;
    }
  }

  onRailGroupClick(group: 'cuenta' | 'turnos' | 'operaciones' | 'reportes' | 'relaciones' | 'cajas'| 'ia'): void {
    this.selectGroup(group);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.isMobilePanelOpen = true;
    }
  }

  closeMobilePanel(): void {
    this.isMobilePanelOpen = false;
  }

  toggleMobileNav(): void {
    this.isMobilePanelOpen = !this.isMobilePanelOpen;
  }

  closeCurrentTab(): void {
    // Solo cerrar el panel móvil
    this.isMobilePanelOpen = false;
  }

}

