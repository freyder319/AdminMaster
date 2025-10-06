import { Component, EventEmitter, Output } from '@angular/core';
import { Cajas, CajasService } from '../services/cajas.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-add_cajas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add_cajas.component.html',
  styleUrl: './add_cajas.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-5px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('shake', [
      transition(':enter', [
        animate('50ms', style({ transform: 'translateX(-4px)' })),
        animate('50ms', style({ transform: 'translateX(4px)' })),
        animate('50ms', style({ transform: 'translateX(-4px)' })),
        animate('50ms', style({ transform: 'translateX(4px)' })),
        animate('50ms', style({ transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class AddCajasComponent {
  @Output() cajaAgregada = new EventEmitter<Cajas>();
  @Output() cerrarOffcanvas = new EventEmitter<void>();

  caja: Cajas[] = [];
  nuevaCaja: Cajas = {} as Cajas;
  estadoInvalido: boolean = false;
  mostrarFormulario = true;

  constructor (private cajasServices: CajasService){}

  // Validar el Codigo de Caja
  codigoCajaExcede: boolean = false;
  codigoCajaNoNumerico: boolean = false;

  validarCodigoCaja() {
    const valor = this.nuevaCaja.codigoCaja ?? '';

    this.codigoCajaExcede = valor.length > 20;
    this.codigoCajaNoNumerico = !/^\d*$/.test(valor);

    if (this.codigoCajaExcede) {
      this.nuevaCaja.codigoCaja = valor.slice(0, 20);
      this.codigoCajaExcede = false;
    }
  }

  // Inicializar el Componente
  ngOnInit():void{
    this.cajasServices.getCajas().subscribe({
    next: (data) => this.caja = data,
    error: (error) => console.error('Error al cargar cajas:',error)
  });
  }

  // Agregar Caja con Validaciones
  agregarCaja(formCaja?: NgForm) {
    this.estadoInvalido = !this.nuevaCaja.estado;
    if (this.estadoInvalido) {
      Swal.fire("Estado Requerido", "Por Favor Selecciona si la Caja está Activa o Inactiva.", "warning");
      return;
    }

    this.cajasServices.getCajas().subscribe({
      next: (cajasExistentes) => {
        const codigoYaExiste = cajasExistentes.some(
          (caja) => caja.codigoCaja === this.nuevaCaja.codigoCaja
        );

        if (codigoYaExiste) {
          Swal.fire("Código Duplicado", "Ya Existe una Caja con ese Código.", "warning");
          return;
        }

        this.cajasServices.createCaja(this.nuevaCaja).subscribe({
          next: (cajaCreada) => {
            this.cajaAgregada.emit(cajaCreada);
            Swal.fire("Caja Agregada", `Se Agregó <strong>${cajaCreada.nombre}</strong> con Éxito.`, "success");
            this.nuevaCaja = {
              id: 0,
              nombre: '',
              codigoCaja: '',
              estado: '',
            };
            this.codigoCajaExcede = false;
            this.codigoCajaNoNumerico = false;
            this.estadoInvalido = false;
            this.mostrarFormulario = false;
            setTimeout(() => {
              this.mostrarFormulario = true;
            }, 0);
            this.cerrarOffcanvas.emit();
          },
          error: (error) => {
            if (error.status === 404) {
              Swal.fire("No Encontrado", "El Recurso Solicitado NO Existe (404).", "error");
            } else if (error.status === 500) {
              Swal.fire("Error del Servidor", "Ocurrió un Error Interno (500). Intenta más Tarde.", "error");
            } else {
              Swal.fire("Error", `No se Pudo Agregar la Caja. Código: ${error.status}`, "error");
            }
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
