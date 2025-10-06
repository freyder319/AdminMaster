import { Component, Input, NgModule, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cajas, CajasService } from '../services/cajas.service';
import Swal from 'sweetalert2';
import { EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modify-caja',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modify-caja.component.html',
  styleUrl: './modify-caja.component.scss'
})
export class ModifyCajaComponent {
  @Input() caja: any;
  @Output() cajaModificada = new EventEmitter<any>();

  formCaja: FormGroup;

  constructor(private fb: FormBuilder, private cajasService: CajasService) {
    this.formCaja = this.fb.group({
      nombre: ['', Validators.required],
      codigoCaja: ['', Validators.required],
      estado: ['', Validators.required],
    });
  }

  ngOnChanges() {
    if (this.caja) {
      this.formCaja.patchValue({
        nombre: this.caja.nombre,
        codigoCaja: this.caja.codigoCaja,
        estado: this.caja.estado || '',
      });
    }
  }

  confirmarModificacion() {
    if (this.formCaja.invalid) {
      Swal.fire("Formulario Incompleto", "Por Favor Completa todos los Campos Requeridos.", "warning");
      return;
    }

    const datosActualizados = {
      ...this.caja,
      ...this.formCaja.value
    };

    this.cajasService.getCajas().subscribe({
      next: (cajasExistentes) => {
        const codigoYaExiste = cajasExistentes.some(
          (caja) =>
            caja.codigoCaja === datosActualizados.codigoCaja &&
            caja.id !== datosActualizados.id 
        );

        if (codigoYaExiste) {
          Swal.fire("Código Duplicado", "Ya Existe otra Caja con ese Código.", "warning");
          return;
        }

        this.cajasService.updateCaja(this.caja.id, datosActualizados).subscribe({
          next: (respuesta) => {
            Swal.fire("Caja Modificada", `Se Actualizó <strong>${respuesta.nombre}</strong> Correctamente.`, "success");
            this.cajaModificada.emit(respuesta);
          },
          error: (error) => {
            if (error.status === 404) {
              Swal.fire("No Encontrada", "La Caja NO Existe (404).", "error");
            } else if (error.status === 500) {
              Swal.fire("Error del servidor", "Ocurrió un Error Interno (500). Intenta más Tarde.", "error");
            } else {
              Swal.fire("Error", `No se Pudo Modificar la Caja. Código: ${error.status}`, "error");
            }
            console.error("Error al Modificar Caja:", error);
          }
        });
      },
      error: (error) => {
        Swal.fire("Error", "No se Pudo Validar el Código de Caja.", "error");
        console.error("Error al Verificar Códigos Existentes:", error);
      }
    });
  }
}
