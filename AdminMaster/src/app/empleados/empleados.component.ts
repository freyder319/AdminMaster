import { Component } from '@angular/core';
import { AdminNavbarComponent } from '../admin_navbar/admin_navbar.component';
import { CommonModule, NgFor } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Empleados ,EmpleadosService } from '../services/empleados.service';
import Swal from 'sweetalert2';
import { AddEmpleadosComponent } from '../add-empleados/add-empleados.component';
import { ModifyEmpleadoComponent } from '../modify-empleado/modify-empleado.component';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-empleados',
  imports: [AdminNavbarComponent, AddEmpleadosComponent, ModifyEmpleadoComponent, CommonModule, RouterModule, NgFor ],
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.scss'
})
export class EmpleadosComponent {
  empleadoSeleccionado: Empleados  | null=null;
  mostrarAddEmpleado = false; 
  mostrarModificarEmpleado = false;
  empleados:Empleados[] = [];
  private search$ = new BehaviorSubject<string>('');
  filteredEmpleados$!: Observable<Empleados[]>;
  lastSearchTerm = '';

  constructor (private empleadosServices: EmpleadosService){}

  ngOnInit(): void {
    this.empleadosServices.getEmpleados().subscribe({
      next: (data) => {
        this.empleados = data;
        // recompute filtered stream when base data changes
        this.filteredEmpleados$ = combineLatest([
          this.search$,
        ]).pipe(
          map(([term]) => {
            const t = (term || '').trim().toLowerCase();
            if (!t) return this.empleados;
            return this.empleados.filter(e =>
              (e.correo?.toLowerCase().includes(t)) ||
              (e.telefono?.toLowerCase().includes(t)) ||
              (e.caja?.nombre?.toLowerCase().includes(t))
            );
          })
        );
      },
      error: (err) => {
        console.error('Error al cargar empleados:', err);
      }
    });
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
}
