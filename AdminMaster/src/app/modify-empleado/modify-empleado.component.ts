import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { EmpleadosService, Empleados } from '../services/empleados.service';

@Component({
  selector: 'app-modify-empleado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modify-empleado.component.html',
  styleUrl: './modify-empleado.component.scss'
})
export class ModifyEmpleadoComponent implements OnInit {
  @Input() empleadoId: number | null = null;
  @Output() empleadoModificado = new EventEmitter();

  empleado: Empleados | null = null;
  cajas: any[] = [];
  cajaIdSeleccionada: number | null = null;
  errorMessage: string = '';

  constructor(private empleadoServices: EmpleadosService) {}

  ngOnInit() {
    if (this.empleadoId !== null) {
      this.empleadoServices.getEmpleado(this.empleadoId).subscribe({
        next: (data) => {
          this.empleado = data;
          this.cajaIdSeleccionada = data.caja?.id || null;
        },
        error: (err) => {
          this.errorMessage = err.status === 404
            ? 'Empleado no encontrado'
            : 'Error al cargar el empleado';
          Swal.fire({
            title: 'Error',
            icon: 'error',
            text: this.errorMessage
          });
        }
      });
    }

    this.empleadoServices.getCajas().subscribe({
      next: (data) => this.cajas = data,
      error: () => console.error("Error al cargar Cajas")
    });
  }

  modificarEmpleado() {
    if (this.empleadoId && this.empleado) {
      const { contrasena, caja, ...resto } = this.empleado;

      if (!this.empleado.nombre || !this.empleado.apellido || !this.empleado.correo || !this.empleado.telefono) {
        Swal.fire({ title: 'Campos incompletos', icon: 'warning', text: 'Nombre, apellido, correo y teléfono son obligatorios.' });
        return;
      }

      const empleadoFinal = {
        nombre: this.empleado.nombre,
        apellido: this.empleado.apellido,
        correo: this.empleado.correo,
        telefono: this.empleado.telefono,
        contrasena: this.empleado.contrasena,
        cajaId: this.cajaIdSeleccionada ?? undefined
      };

      this.empleadoServices.updateEmpleado(this.empleadoId, empleadoFinal).subscribe({
        next: () => {
          Swal.fire({
            title: "Empleado Modificado!", 
            icon: "success",
            html: `El Empleado fue Modificado con éxito`,
            draggable: true
          });
          this.empleadoModificado.emit();
        },
        error: (err) => {
          const mensaje = err.status === 400 ? err.error.message : 'Error inesperado';
          Swal.fire({ title: "Error", icon: "error", text: mensaje });
        }
      });
    }
  }
}
