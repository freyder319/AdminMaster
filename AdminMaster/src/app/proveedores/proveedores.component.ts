import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AddProveedorComponent } from "../add_proveedor/add_proveedor.component";
import { ModifyProveedorComponent } from '../modify-proveedor/modify-proveedor.component';
import { ProveedorService, Proveedor } from '../services/proveedor.service';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import Swal from 'sweetalert2';
import { GastoService, Gasto } from '../services/gasto.service';
import { AgenteIAComponent } from "../agente-ia/agente-ia.component";

@Component({
  selector: 'app_proveedores',
  standalone: true,
  imports: [AdminNavbarComponent, AddProveedorComponent, CommonModule, RouterModule, ModifyProveedorComponent, AgenteIAComponent],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.scss']
})
export class ProveedoresComponent {
  mostrarAddProveedor = false; 
  mostrarModificarProveedor = false;

  proveedores$: Observable<Proveedor[]>;
  private search$ = new BehaviorSubject<string>('');
  filteredProveedores$: Observable<Proveedor[]>;
  seleccionado: Proveedor | null = null;
  lastSearchTerm = '';

  private proveedoresEnUso = new Set<number>();
  private deudasPendientesPorProveedor = new Map<number, number>();

  constructor(private proveedorService: ProveedorService, private gastoService: GastoService) {
    this.proveedores$ = this.proveedorService.proveedores$;
    this.filteredProveedores$ = combineLatest([
      this.proveedores$,
      this.search$,
    ]).pipe(
      map(([list, term]) => {
        const t = term.trim().toLowerCase();
        const base = !t ? list : list.filter(p =>
          (p.nombreEmpresa?.toLowerCase().includes(t)) ||
          (p.contactoNombre?.toLowerCase().includes(t)) ||
          (p.correo?.toLowerCase().includes(t)) ||
          (p.telefono?.toLowerCase().includes(t))
        );
        // ordenar: activos primero, inactivos al final
        return [...base].sort((a,b) => (a.activo === b.activo) ? 0 : (a.activo ? -1 : 1));
      })
    );

    // construir set de proveedores en uso y conteo de deudas pendientes desde gastos
    this.gastoService.gastos$.subscribe((gastos) => {
      const ids: number[] = [];
      const contador = new Map<number, number>();

      (gastos || []).forEach((g) => {
        const provId = g.proveedorId;
        if (typeof provId === 'number' && Number.isFinite(provId)) {
          ids.push(provId);

          if (g.estado === 'pendiente') {
            const actual = contador.get(provId) ?? 0;
            contador.set(provId, actual + 1);
          }
        }
      });

      this.proveedoresEnUso = new Set(ids);
      this.deudasPendientesPorProveedor = contador;
    });

    // cargar gastos al iniciar si no hay snapshot
    try {
      if (!this.gastoService.snapshot || this.gastoService.snapshot.length === 0) {
        this.gastoService.fetchAll().subscribe();
      }
    } catch {}
  }

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

  onSearch(value: string): void {
    this.lastSearchTerm = value || '';
    this.search$.next(value || '');
  }

  private closeOffcanvas(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    const w = window as any;
    const bs = w?.bootstrap;
    try {
      let instance = bs?.Offcanvas?.getInstance?.(el);
      if (!instance && bs?.Offcanvas) {
        instance = new bs.Offcanvas(el);
      }
      if (instance?.hide) {
        instance.hide();
      }
    } catch {
      // noop fallback if bootstrap js is not available
      el.classList.remove('show');
    }
  }

  onCrear(data: { nombreEmpresa?: string; nit?: string; contactoNombre?: string; telefono: string; correo: string; activo: boolean }): void {
    const payload = {
      nombreEmpresa: (data.nombreEmpresa || '').trim() || undefined,
      nit: (data.nit || '').trim() || undefined,
      contactoNombre: (data.contactoNombre || '').trim() || undefined,
      telefono: (data.telefono || '').trim(),
      correo: (data.correo || '').trim().toLowerCase(),
      activo: typeof data.activo === 'boolean' ? data.activo : true,
    } as Omit<Proveedor, 'id'>;
    this.proveedorService.add(payload).subscribe({
      next: () => {
        // cerrar vista móvil si está abierta
        this.mostrarAddProveedor = false;
        // cerrar offcanvas de escritorio si está abierto
        this.closeOffcanvas('offcanvasAddProveedor');
        Swal.fire({
          title: 'Proveedor Registrado!',
          icon: 'success',
          html: `El Proveedor <b>${payload.nombreEmpresa || payload.contactoNombre || payload.correo}</b> fue Registrado con Éxito`,
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Ocurrió un error inesperado';
        Swal.fire({ title: 'Error', text: msg, icon: 'error', confirmButtonText: 'Aceptar' });
        console.error('Error crear proveedor:', err);
      }
    });
  }

  seleccionar(proveedor: Proveedor): void {
    this.seleccionado = proveedor;
  }

  onGuardar(cambios: Partial<Proveedor>): void {
    if (!this.seleccionado) return;
    this.proveedorService.update(this.seleccionado.id, cambios).subscribe({
      next: () => {
        // cerrar vista móvil si está abierta
        this.mostrarModificarProveedor = false;
        // cerrar offcanvas de escritorio si está abierto
        this.closeOffcanvas('offcanvasModifyProveedor');
        Swal.fire({
          title: 'Proveedor Modificado!',
          icon: 'success',
          html: 'El <b>Proveedor</b> fue Modificado con Éxito',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        const msg = err?.error?.message || 'Ocurrió un error inesperado';
        Swal.fire({
          title: 'Error',
          text: msg,
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        console.error(err);
      }
    });
  }

  onEliminar(id: number): void {
    Swal.fire({
      title: '¿Eliminar proveedor?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.proveedorService.remove(id).subscribe({
          next: () => {
            if (this.seleccionado && this.seleccionado.id === id) {
              this.seleccionado = null;
            }
            // cerrar offcanvas de modificar si está abierto
            this.mostrarModificarProveedor = false;
            this.closeOffcanvas('offcanvasModifyProveedor');
            Swal.fire({
              title: 'Eliminado',
              html: 'El <b>Proveedor</b> fue Eliminado Correctamente',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
          },
          error: (err) => {
            const backendMsg = err?.error?.message || '';
            const related = typeof backendMsg === 'string' && backendMsg.toLowerCase().includes('relacion');
            if (related && this.seleccionado && this.seleccionado.id === id) {
              // si está relacionado, ofrecer inhabilitar en lugar de eliminar
              Swal.fire({
                title: 'Proveedor relacionado',
                text: 'No se puede eliminar porque tiene registros relacionados. ¿Deseas inhabilitarlo?',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Inhabilitar',
                cancelButtonText: 'Cerrar'
              }).then(r => {
                if (r.isConfirmed) this.inhabilitarProveedor(this.seleccionado!);
              });
            } else {
              Swal.fire({ title: 'Error', text: backendMsg || 'No se pudo eliminar el proveedor', icon: 'error', confirmButtonText: 'Aceptar' });
            }
            console.error('Error eliminar proveedor:', err);
          }
        });
      }
    });
  }

  onEliminarSeleccionado(): void {
    if (this.seleccionado) {
      this.onEliminar(this.seleccionado.id);
      this.mostrarModificarProveedor = false;
    }
  }

  inhabilitarProveedor(p: Proveedor) {
    this.proveedorService.update(p.id, { activo: false }).subscribe({
      next: () => {
        if (this.seleccionado && this.seleccionado.id === p.id) {
          this.seleccionado = { ...this.seleccionado, activo: false };
        }
      },
      error: (err) => {
        Swal.fire({ title: 'Error', text: 'No se pudo inhabilitar el proveedor', icon: 'error' });
        console.error('Error inhabilitar proveedor:', err);
      }
    });
  }

  habilitarProveedor(p: Proveedor) {
    this.proveedorService.update(p.id, { activo: true }).subscribe({
      next: () => {
        if (this.seleccionado && this.seleccionado.id === p.id) {
          this.seleccionado = { ...this.seleccionado, activo: true };
        }
      },
      error: (err) => {
        Swal.fire({ title: 'Error', text: 'No se pudo habilitar el proveedor', icon: 'error' });
        console.error('Error habilitar proveedor:', err);
      }
    });
  }

  isProveedorEnUso(idOrP: number | Proveedor | null | undefined): boolean {
    if (idOrP == null) return false;
    const id = typeof idOrP === 'number' ? idOrP : idOrP.id;
    return this.proveedoresEnUso.has(id);
  }

  getDeudasPendientes(p: Proveedor | null | undefined): number {
    if (!p) return 0;
    return this.deudasPendientesPorProveedor.get(p.id) ?? 0;
  }
}
