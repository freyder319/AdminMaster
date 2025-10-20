import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AddCajasComponent } from "../add_cajas/add_cajas.component";
import { ModifyCajaComponent } from '../modify-caja/modify-caja.component';
import { Cajas, CajasService } from '../services/cajas.service';
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
  // búsqueda reactiva
  private search$ = new BehaviorSubject<string>('');
  filteredCajas$!: Observable<Cajas[]>;
  lastSearchTerm = '';
  constructor (private cajasServices: CajasService){}

  ngOnInit(): void {
    this.cajasServices.getCajas().subscribe({
      next: (data) => {
        this.cajasFiltrar = data;
        this.cajas = data;
        // construir stream filtrado basado en término de búsqueda
        this.filteredCajas$ = combineLatest([
          this.search$,
        ]).pipe(
          map(([term]) => {
            const t = (term || '').trim().toLowerCase();
            if (!t) return this.cajas;
            return this.cajas.filter(caja =>
              caja.nombre?.toLowerCase().includes(t) ||
              caja.codigoCaja?.toLowerCase().includes(t) ||
              caja.estado?.toLowerCase().includes(t)
            );
          })
        );
      },
      error: (error) => console.error('Error al Cargar Cajas:', error)
    });
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
    this.cajas.unshift(caja);
    this.mostrarAddCaja = false; 
  }

  abrirModificarCaja(caja: Cajas) {
    this.cajaSeleccionada = caja;

    // Solo activa la vista móvil
    if (window.innerWidth < 768) {
      this.mostrarModificarCaja = true;
    }
  }

  onCajaModificada(cajaActualizada: any) {
    this.obtenerCajas(); 
    this.mostrarModificarCaja = false; 
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
            this.ngOnInit();
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
}
