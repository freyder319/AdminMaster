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
      // Normalizar estado a los mismos valores usados en creación (Activa/Inactiva)
      const rawEstado = (this.caja.estado || '').toString().toLowerCase();
      let estadoNormalizado = '';
      if (rawEstado === 'activa' || rawEstado === 'activo') {
        estadoNormalizado = 'Activa';
      } else if (rawEstado === 'inactiva' || rawEstado === 'inactivo') {
        estadoNormalizado = 'Inactiva';
      }
      this.formCaja.patchValue({
        nombre: this.caja.nombre,
        codigoCaja: this.caja.codigoCaja,
        estado: estadoNormalizado || this.caja.estado || '',
      });
    }
  }

  confirmarModificacion() {
    if (this.formCaja.invalid) {
      Swal.fire({
        title: "Campos incompletos",
        icon: "warning",
        text: "Por favor Completa todos los Campos Requeridos.",
      });
      return;
    }

    const datosActualizados = {
      ...this.caja,
      ...this.formCaja.value
    } as any;

    this.cajasService.getCajas().subscribe({
      next: (cajasExistentes) => {
        const codigoYaExiste = cajasExistentes.some(
          (caja) =>
            caja.codigoCaja === datosActualizados.codigoCaja &&
            caja.id !== this.caja.id 
        );

        if (codigoYaExiste) {
          Swal.fire("Código Duplicado", "Ya Existe otra Caja con ese Código.", "warning");
          return;
        }

        // El backend no acepta id/creadoEn/actualizadoEn en el cuerpo del PUT
        const { id, creadoEn, actualizadoEn, ...payload } = datosActualizados;

        this.cajasService.updateCaja(this.caja.id, payload).subscribe({
          next: (respuesta) => {
            Swal.fire({
              title: "Caja Modificada!",
              icon: "success",
              html: `La <b>Caja</b> fue Modificada con Éxito`,
              timer: 2000,
              showConfirmButton: false
            });
            this.cajaModificada.emit(respuesta);
          },
          error: (error) => {
            let detalle: string;
            const backendMsg = error?.error?.message;
            if (typeof backendMsg === 'string') {
              detalle = backendMsg;
            } else if (Array.isArray(backendMsg)) {
              detalle = backendMsg.map((m: any) => String(m)).join('<br>');
            } else {
              detalle = `Ocurrió un error inesperado (código: ${error?.status ?? 'desconocido'})`;
            }

            if (error.status === 404) {
              Swal.fire({ icon: 'error', title: 'No Encontrada', html: 'La Caja NO Existe (404).' });
            } else if (error.status === 500) {
              Swal.fire({ icon: 'error', title: 'Error del servidor', html: 'Ocurrió un Error Interno (500). Intenta más Tarde.' });
            } else {
              Swal.fire({ icon: 'error', title: 'Error', html: detalle });
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
