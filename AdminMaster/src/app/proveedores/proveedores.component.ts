import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AddProveedorComponent } from "../add_proveedor/add_proveedor.component";
import { ModifyProveedorComponent } from '../modify-proveedor/modify-proveedor.component';
import { ProveedorService, Proveedor } from '../services/proveedor.service';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app_proveedores',
  standalone: true,
  imports: [AdminNavbarComponent, AddProveedorComponent, CommonModule,RouterModule, ModifyProveedorComponent],
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

  constructor(private proveedorService: ProveedorService) {
    this.proveedores$ = this.proveedorService.proveedores$;
    this.filteredProveedores$ = combineLatest([
      this.proveedores$,
      this.search$,
    ]).pipe(
      map(([list, term]) => {
        const t = term.trim().toLowerCase();
        if (!t) return list;
        return list.filter(p =>
          (p.nombre?.toLowerCase().includes(t)) ||
          (p.apellido?.toLowerCase().includes(t)) ||
          (p.correo?.toLowerCase().includes(t)) ||
          (p.telefono?.toLowerCase().includes(t))
        );
      })
    );
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

  onCrear(data: { nombre: string; apellido: string; telefono: string; correo: string; activo: boolean }): void {
    this.proveedorService.add(data).subscribe({
      next: () => {
        // cerrar vista móvil si está abierta
        this.mostrarAddProveedor = false;
        // cerrar offcanvas de escritorio si está abierto
        this.closeOffcanvas('offcanvasAddProveedor');
        Swal.fire({
          title: 'Creado',
          text: 'Proveedor creado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo crear el proveedor',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        console.error(err);
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
          title: 'Actualizado',
          text: 'Proveedor actualizado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar el proveedor',
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
              text: 'Proveedor eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
          },
          error: (err) => {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar el proveedor',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
            console.error(err);
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
}
