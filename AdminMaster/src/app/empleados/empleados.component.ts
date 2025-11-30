import { Component } from '@angular/core';
import { AdminNavbarComponent } from '../admin_navbar/admin_navbar.component';
import { CommonModule, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Empleados ,EmpleadosService } from '../services/empleados.service';
import Swal from 'sweetalert2';
import { AddEmpleadosComponent } from '../add-empleados/add-empleados.component';
import { ModifyEmpleadoComponent } from '../modify-empleado/modify-empleado.component';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { TurnosService, TurnoActivoItem } from '../services/turnos.service';
import { Cajas, CajasService } from '../services/cajas.service';
import { AgenteIAComponent } from "../agente-ia/agente-ia.component";

@Component({
  selector: 'app-empleados',
  imports: [AdminNavbarComponent, AddEmpleadosComponent, ModifyEmpleadoComponent, CommonModule, RouterModule, NgFor, AgenteIAComponent],
  templateUrl: './empleados.component.html',
  styleUrls: ['./empleados.component.scss']
})
export class EmpleadosComponent {
  empleadoSeleccionado: Empleados  | null=null;
  mostrarAddEmpleado = false; 
  mostrarModificarEmpleado = false;
  cargando = false;
  empleados:Empleados[] = [];
  private search$ = new BehaviorSubject<string>('');
  filteredEmpleados$: Observable<Empleados[]> = combineLatest([
    this.search$,
  ]).pipe(
    map(([term]) => {
      const t = (term || '').trim().toLowerCase();
      const base = !t ? this.empleados : this.empleados.filter(e =>
        (e.correo?.toLowerCase().includes(t)) ||
        (e.telefono?.toLowerCase().includes(t)) ||
        (e.caja?.nombre?.toLowerCase().includes(t))
      );
      // ordenar: activos primero, inactivos al final
      return [...base].sort((a, b) => {
        const aIna = this.estadoEmpleado(a) === 'Inactivo' ? 1 : 0;
        const bIna = this.estadoEmpleado(b) === 'Inactivo' ? 1 : 0;
        return aIna - bIna;
      });
    })
  );
  lastSearchTerm = '';
  private correosEnTurno = new Set<string>();
  private cajasDisponibles: Cajas[] = [];

  constructor (
    private empleadosServices: EmpleadosService,
    private turnosService: TurnosService,
    private cajasService: CajasService,
  ){}

  focusFirstInput(offcanvasId: string): void {
    const offcanvas = document.getElementById(offcanvasId);
    if (!offcanvas) return;

    let input = offcanvas.querySelector('input[data-autofocus="true"]') as HTMLInputElement | null;
    if (!input) {
      input = offcanvas.querySelector('input') as HTMLInputElement | null;
    }

    if (input) {
      setTimeout(() => {
        input?.focus();
        (input as any)?.select?.();
      }, 50);
    }
  }

  ngOnInit(): void {
    this.cargando = true;
    this.empleadosServices.getEmpleados().subscribe({
      next: (data) => {
        this.empleados = data || [];
        // forzar recálculo de la lista filtrada con el término actual (o vacío)
        this.search$.next(this.lastSearchTerm || '');
        // cargar relación de turnos (activos y cerrados, por correo)
        try {
          this.turnosService.getTurnosActivosPublic().subscribe({
            next: (activos) => this.mergeCorreosTurnos(activos || []),
            error: () => {}
          });
          this.turnosService.getTurnosCerradosPublic().subscribe({
            next: (cerrados) => this.mergeCorreosTurnos(cerrados || []),
            error: () => {}
          });
        } catch {}
      },
      error: (err) => {
        console.error('Error al cargar empleados:', err);
      },
      complete: () => {
        this.cargando = false;
      }
    });
    // cargar cajas disponibles para habilitar (asignar caja)
    try {
      this.cajasService.getCajas().subscribe({
        next: (cajas) => { this.cajasDisponibles = cajas || []; },
        error: () => { this.cajasDisponibles = []; }
      });
    } catch { this.cajasDisponibles = []; }
  }

  onSearch(value: string): void {
    this.lastSearchTerm = value || '';
    this.search$.next(this.lastSearchTerm);
  }

  guardarId(id: number) {
    this.empleadoSeleccionado = this.empleados.find(c => c.id === id) || null;
    if (window.innerWidth < 768) {
      this.mostrarModificarEmpleado = true;
    }
  }

  mostrarInterfazReponsive(id:number){
    this.empleadoSeleccionado = this.empleados.find(c => c.id === id) || null;
    this.mostrarModificarEmpleado = true;
  }

  eliminarEmpleado(id:number){
    Swal.fire({
    title: "Estas Seguro?",
    html: `Realmente Deseas Eliminar al Empleado</b>?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Si, Eliminar!"
  }).then((result) => {
    if (result.isConfirmed) {
      this.empleadosServices.deleteEmpleado(id).subscribe({
        next: () => {
          Swal.fire({
            title: "Eliminado!",
            html: `Empleado Eliminado.`,
            icon: "success"
          });
          this.mostrarModificarEmpleado = false;
          this.ngOnInit();
        },
        error: (err)=> {
          let mensaje = 'Ocurrió un error al eliminar el empleado';
          if (err.status >= 500) {
            mensaje = 'Error en el servidor. Intente más tarde.';
          } else if (err.status === 404) {
            mensaje = 'El Empleado no existe o ya fue eliminado.';
          } else if (err.status === 400) {
            mensaje = 'Solicitud inválida.';
          }
          Swal.fire({
            icon: "error",
            title: "Error...",
            text: mensaje,
          });
        }
      })
      
    }
  });
  }

  onEmpleadoAgregado(){
    this.ngOnInit();
    this.mostrarAddEmpleado = false; 
  }

  onEmpleadoModificado(){
    this.ngOnInit();
    this.mostrarModificarEmpleado = false;
  }

  private mergeCorreosTurnos(items: TurnoActivoItem[]) {
    for (const it of items) {
      const mail = (it as any)?.correo || '';
      if (typeof mail === 'string' && mail.trim().length > 0) {
        this.correosEnTurno.add(mail.trim().toLowerCase());
      }
    }
  }

  isEmpleadoEnUso(e: Empleados | null | undefined): boolean {
    if (!e) return false;
    const tieneCaja = !!(e.cajaId != null || (e as any).caja?.id);
    const mail = (e.correo || '').toLowerCase().trim();
    const enTurno = !!mail && this.correosEnTurno.has(mail);
    return tieneCaja || enTurno;
  }

  estadoEmpleado(e: Empleados | null | undefined): 'Activo' | 'Inactivo' {
    if (!e) return 'Inactivo';

    const rawEstado = (e as any).estado as string | undefined;
    if (rawEstado && rawEstado.toUpperCase() !== 'ACTIVO') {
      // Si el backend marca el empleado como NO ACTIVO (por ejemplo INACTIVO),
      // siempre se considera Inactivo, aunque tenga caja asignada.
      return 'Inactivo';
    }

    const tieneCaja = !!(e.cajaId != null || (e as any).caja?.id);
    return tieneCaja ? 'Activo' : 'Inactivo';
  }

  inhabilitarEmpleado(e: Empleados) {
    const payload: Partial<Empleados> = { cajaId: null } as any;
    this.empleadosServices.updateEmpleado(e.id, payload).subscribe({
      next: () => {
        const idx = this.empleados.findIndex(x => x.id === e.id);
        if (idx >= 0) {
          const copia = { ...this.empleados[idx] } as any;
          copia.cajaId = null;
          if (copia.caja) copia.caja = undefined;
          this.empleados[idx] = copia as Empleados;
          this.empleados = [...this.empleados];
        }

        // si está abierto en la vista móvil, reflejar cambio inmediatamente
        if (this.empleadoSeleccionado && this.empleadoSeleccionado.id === e.id) {
          const sel: any = { ...this.empleadoSeleccionado };
          sel.cajaId = null;
          if (sel.caja) sel.caja = undefined;
          this.empleadoSeleccionado = sel as Empleados;
        }

        // forzar recalculo de la lista filtrada para reflejar fila gris y estado
        this.search$.next(this.lastSearchTerm || '');
      },
      error: () => { /* sin alertas */ }
    });
  }

  habilitarEmpleado(e: Empleados) {
    // Si el empleado no tiene contraseña registrada, no permitir habilitar
    const contrasena = (e as any)?.contrasena as string | undefined;
    const tieneContrasena = !!contrasena && contrasena.trim().length > 0;
    if (!tieneContrasena) {
      Swal.fire({
        icon: 'warning',
        title: 'Cuenta no Activada',
        html: 'La cuenta del empleado aún no ha sido activada. Debe activar su cuenta desde el correo de activación antes de habilitarlo.',
        confirmButtonColor: 'brown'
      });
      return;
    }

    // Abrir formulario de modificar para asignar caja y mostrar información
    this.empleadoSeleccionado = e;
    if (window.innerWidth < 768) {
      this.mostrarModificarEmpleado = true;
    } else {
      try {
        const el = document.getElementById('offcanvasModifyEmpleado');
        const w = window as any;
        const bs = w?.bootstrap;
        let instance = bs?.Offcanvas?.getInstance?.(el);
        if (!instance && bs?.Offcanvas) instance = new bs.Offcanvas(el);
        instance?.show?.();
      } catch {}
    }
    Swal.fire({ icon: 'info', title: 'Habilitar Empleado', html: 'Para Habilitar al Empleado debes <b>Asignarle una Caja</b> y colocar su <b>Estado en Activo</b>.', timer: 2200, showConfirmButton: false });
  }
}
