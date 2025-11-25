import { NgIf } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import Swal from 'sweetalert2';
import { TurnosService } from '../services/turnos.service';
import { TurnoStateService, TurnoActivoState } from '../services/turno-state.service';
import { Observable } from 'rxjs';

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
  selectedGroup: 'cuenta' | 'turnos' | 'operaciones' | 'reportes' | 'relaciones' = 'operaciones';
  isMobilePanelOpen = false;
  isMobileView = false;
  mobileGroupsExpanded = {
    cuenta: false,
    turnos: false,
    operaciones: false,
    reportes: false,
    relaciones: false,
  } as const;

  constructor(private router: Router, private turnosService: TurnosService, private turnoState: TurnoStateService) {}

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

  toggleMobileGroup(group: 'cuenta' | 'turnos' | 'operaciones' | 'reportes' | 'relaciones') {
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

  private syncGroupWithUrl(url: string) {
    const u = (url || '').toLowerCase();
    // Rutas de Turnos y caja (siempre antes que Cuenta para no pisar)
    if (
      u.includes('/turno-empleado/registros-turno') ||
      u.includes('/turno-empleado/activos') ||
      u.includes('/turno-empleado/cerrados') ||
      u.includes('/turno-empleado/historial') ||
      u.includes('/turno-empleado/notificaciones') ||
      u.includes('/turno-empleado/auditoria-caja') ||
      u.includes('/cajas')
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

  selectGroup(group: 'cuenta' | 'turnos' | 'operaciones' | 'reportes' | 'relaciones') {
    this.selectedGroup = group;
    if (group !== 'cuenta') {
      this.showTurnMenu = false;
    }
  }

  irAOpcionTurno(segmento: string | null) {
    if ((this.rol || '').toLowerCase() !== 'admin') {
      return;
    }
    const commands = segmento ? ['/turno-empleado', segmento] : ['/turno-empleado'];
    this.router.navigate(commands);
    this.showTurnMenu = false;
  }

  onRailClick(): void {
    this.isMobilePanelOpen = !this.isMobilePanelOpen;
  }

  onRailGroupClick(group: 'cuenta' | 'turnos' | 'operaciones' | 'reportes' | 'relaciones'): void {
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

}

