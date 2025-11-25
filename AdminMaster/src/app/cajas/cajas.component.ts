import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AddCajasComponent } from "../add_cajas/add_cajas.component";
import { ModifyCajaComponent } from '../modify-caja/modify-caja.component';
import { Cajas, CajasService } from '../services/cajas.service';
import { Empleados, EmpleadosService } from '../services/empleados.service';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
declare var bootstrap: any;

@Component({
  selector: 'app-cajas',
  standalone: true,
  imports: [AdminNavbarComponent, AddCajasComponent, ModifyCajaComponent, CommonModule, RouterModule, NgFor, FormsModule],
  templateUrl: './cajas.component.html',
  styleUrl: './cajas.component.scss'
})
export class CajasComponent {
  cajaSeleccionada: Cajas  | null=null;
  mostrarAddCaja = false; 
  mostrarModificarCaja = false;
  cajas:Cajas[] = [];
  cajasFiltrar: Cajas[] = []; 
  empleados: Empleados[] = [];
  private cajasEnUso = new Set<number>();
  private codigosCajaEnUso = new Set<string>();
  // streams reactivos
  private search$ = new BehaviorSubject<string>('');
  private cajas$ = new BehaviorSubject<Cajas[]>([]);
  filteredCajas$!: Observable<Cajas[]>;
  lastSearchTerm = '';
  constructor (private cajasServices: CajasService, private empleadosService: EmpleadosService){}

  ngOnInit(): void {
    this.cajasServices.getCajas().subscribe({
      next: (data) => {
        this.cajasFiltrar = data;
        this.cajas = data;
        this.cajas$.next(this.cajas);
        // construir stream filtrado basado en término de búsqueda y lista
        this.filteredCajas$ = combineLatest([
          this.cajas$,
          this.search$,
        ]).pipe(
          map(([cajas, term]) => {
            const t = (term || '').trim().toLowerCase();
            const base = !t ? cajas : cajas.filter(caja =>
              caja.nombre?.toLowerCase().includes(t) ||
              caja.codigoCaja?.toLowerCase().includes(t) ||
              caja.estado?.toLowerCase().includes(t)
            );
            // ordenar: activas primero, inactivas al final
            return [...base].sort((a, b) => {
              const aIna = (a.estado || '').toLowerCase() === 'inactiva' ? 1 : 0;
              const bIna = (b.estado || '').toLowerCase() === 'inactiva' ? 1 : 0;
              return aIna - bIna;
            });
          })
        );
        // cargar empleados para detectar relaciones de caja
        this.cargarEmpleados();
      },
      error: (error) => console.error('Error al Cargar Cajas:', error)
    });
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

  cerrarOffcanvas() {
    const offcanvasElement = document.getElementById('offcanvasAddCaja');
    if (offcanvasElement) {
      const offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement);
      offcanvasInstance.hide();
    }
  }

  obtenerCajas() {
    this.cajasServices.getCajas().subscribe({
      next: (data) => {
        this.cajasFiltrar = data;
        this.cajas = data;
        this.cajas$.next(this.cajas);
        // actualizar relaciones tras recargar cajas
        this.cargarEmpleados();
      },
      error: (error) => console.error('Error al Cargar Cajas:', error)
    });
  }

  onSearch(value: string): void {
    this.lastSearchTerm = value || '';
    this.search$.next(this.lastSearchTerm);
  }

  mostrarInterfazReponsive(id:number){
    this.cajaSeleccionada = this.cajas.find(c => c.id === id) || null;
    this.mostrarModificarCaja = true;
  }

  onCajaAgregada(caja: Cajas) {
    // Optimistic update
    this.cajas = [caja, ...(this.cajas || [])];
    this.cajas$.next(this.cajas);
    // Then refetch to sync with server
    this.obtenerCajas();
    this.mostrarAddCaja = false;
    this.lastSearchTerm = '';
    this.search$.next(this.lastSearchTerm);
    // actualizar relaciones
    this.cargarEmpleados();
  }

  abrirModificarCaja(caja: Cajas) {
    this.cajaSeleccionada = caja;

    // Solo activa la vista móvil
    if (window.innerWidth < 768) {
      this.mostrarModificarCaja = true;
    }
  }

  onCajaModificada(cajaActualizada: any) {
    // Optimistic update
    const idx = (this.cajas || []).findIndex(c => c.id === cajaActualizada?.id);
    if (idx >= 0) {
      this.cajas[idx] = { ...this.cajas[idx], ...cajaActualizada } as Cajas;
      this.cajas = [...this.cajas];
      this.cajas$.next(this.cajas);
    }
    // Then refetch to sync with server
    this.obtenerCajas();
    this.mostrarModificarCaja = false;
    this.lastSearchTerm = '';
    this.search$.next(this.lastSearchTerm);
  }

  eliminarCaja(id: number) {
    const caja = this.cajas.find(c => c.id === id);
    const nombre = caja?.nombre || 'Caja desconocida';

    Swal.fire({
      title: "¿Estás Seguro?",
      html: `¿Deseas Eliminar a <strong>${nombre}</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2fd520ff",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, Eliminar!"
    }).then((result) => {
      if (result.isConfirmed) {
        this.cajasServices.deleteCaja(id).subscribe({
          next: () => {
            Swal.fire({
              title: "Eliminada",
              html: `<strong>${nombre}</strong> ha sido Eliminada Correctamente.`,
              icon: "success"
            });
            this.mostrarModificarCaja = false;
            // Optimistic removal
            this.cajas = (this.cajas || []).filter(c => c.id !== id);
            this.cajas$.next(this.cajas);
            // Then refetch to sync with server
            this.obtenerCajas();
            this.lastSearchTerm = '';
            this.search$.next(this.lastSearchTerm);
            // actualizar relaciones
            this.cargarEmpleados();
          },
          error: (err) => {
            let mensaje = 'Ocurrió un Error al Eliminar la Caja';
            if (err.status >= 500) {
              mensaje = 'Error en el Servidor. Intente más Tarde.';
            } else if (err.status === 404) {
              mensaje = 'La Caja NO Existe o ya fue Eliminada.';
            } else if (err.status === 400) {
              mensaje = 'Solicitud Inválida.';
            }
            Swal.fire({
              icon: "error",
              title: "Error...",
              text: mensaje,
            });
          }
        });
      }
    });
  }

  private cargarEmpleados() {
    this.empleadosService.getEmpleados().subscribe({
      next: (emps) => {
        this.empleados = emps || [];
        const ids = (this.empleados || [])
          .map(e => {
            const directId: any = (e as any).cajaId;
            const nestedId: any = (e as any).caja?.id;
            const candidate = directId != null ? directId : nestedId;
            const n = typeof candidate === 'string' ? parseInt(candidate, 10) : candidate;
            return Number.isFinite(n) ? Number(n) : null;
          })
          .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
        this.cajasEnUso = new Set<number>(ids);
        const codes = (this.empleados || [])
          .map(e => (e as any).caja?.codigoCaja)
          .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
          .map(v => v.trim().toLowerCase());
        this.codigosCajaEnUso = new Set<string>(codes);
      },
      error: (error) => console.error('Error al Cargar Empleados:', error)
    });
  }

  isCajaEnUso(idOrCaja: number | Cajas | undefined | null): boolean {
    if (idOrCaja == null) return false;
    if (typeof idOrCaja === 'number') {
      return this.cajasEnUso.has(idOrCaja);
    }
    const byId = idOrCaja.id != null && this.cajasEnUso.has(idOrCaja.id);
    const code = (idOrCaja.codigoCaja || '').toLowerCase().trim();
    const byCode = !!code && this.codigosCajaEnUso.has(code);
    return byId || byCode;
  }

  inhabilitarCaja(caja: Cajas) {
    this.cajasServices.updateCaja(caja.id, { estado: 'Inactiva' }).subscribe({
      next: (updated) => {
        const idx = (this.cajas || []).findIndex(c => c.id === caja.id);
        if (idx >= 0) {
          this.cajas[idx] = { ...this.cajas[idx], estado: updated.estado || 'Inactiva' } as Cajas;
          this.cajas = [...this.cajas];
          this.cajas$.next(this.cajas);
        }
        this.obtenerCajas();
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error...',
          text: 'No se pudo Inhabilitar la Caja.'
        });
      }
    });
  }

  habilitarCaja(caja: Cajas) {
    this.cajasServices.updateCaja(caja.id, { estado: 'Activa' }).subscribe({
      next: (updated) => {
        const idx = (this.cajas || []).findIndex(c => c.id === caja.id);
        if (idx >= 0) {
          this.cajas[idx] = { ...this.cajas[idx], estado: updated.estado || 'Activa' } as Cajas;
          this.cajas = [...this.cajas];
          this.cajas$.next(this.cajas);
        }
        this.obtenerCajas();
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error...',
          text: 'No se pudo Habilitar la Caja.'
        });
      }
    });
  }
}
