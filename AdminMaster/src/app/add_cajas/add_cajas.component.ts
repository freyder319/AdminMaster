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
  nuevaCaja = { codigoCaja: '', nombre: '', estado: 'Activa' }; // CORREGIDO: no enviar id

  estadoInvalido = false;
  mostrarFormulario = true;

  constructor(private cajasServices: CajasService) {}

  // Validaciones
  codigoCajaExcede = false;
  codigoCajaNoNumerico = false;
  codigoCajaDuplicado = false;

  validarCodigoCaja() {
    const valor = this.nuevaCaja.codigoCaja ?? '';

    this.codigoCajaExcede = valor.length > 20;
    this.codigoCajaNoNumerico = !/^\d*$/.test(valor);

    if (this.codigoCajaExcede || this.codigoCajaNoNumerico || !valor) {
      this.codigoCajaDuplicado = false;
    } else {
      this.codigoCajaDuplicado = this.caja.some(c => (c.codigoCaja || '') === valor);
    }

    if (this.codigoCajaExcede) {
      this.nuevaCaja.codigoCaja = valor.slice(0, 20);
      this.codigoCajaExcede = false;
    }
  }

  ngOnInit(): void {
    this.cajasServices.getCajas().subscribe({
      next: (data) => this.caja = data,
      error: (error) => console.error('Error al Cargar Cajas:', error)
    });
  }

  agregarCaja(formCaja?: NgForm) {
    this.estadoInvalido = !this.nuevaCaja.estado;
    if (this.estadoInvalido) {
      Swal.fire({
        title: "Estado Requerido",
        icon: "warning",
        html: "Por favor selecciona si la <b>Caja</b> está Activa o Inactiva.",
      });
      return;
    }

    this.cajasServices.getCajas().subscribe({
      next: (cajasExistentes) => {
        const codigoYaExiste = cajasExistentes.some(
          (caja) => caja.codigoCaja === this.nuevaCaja.codigoCaja
        );

        if (codigoYaExiste) {
          Swal.fire("Código Duplicado", "Ya Existe una <b>Caja</b> con ese Código.", "warning");
          return;
        }

        // CORREGIDO: enviar solo los campos válidos
        this.cajasServices.createCaja({
          codigoCaja: this.nuevaCaja.codigoCaja,
          nombre: this.nuevaCaja.nombre,
          estado: this.nuevaCaja.estado
        }).subscribe({
          next: (cajaCreada) => {
            this.cajaAgregada.emit(cajaCreada);
            Swal.fire({
              title: "Caja Registrada!",
              icon: "success",
              html: `La Caja <b>${cajaCreada.nombre}</b> fue Registrada con Éxito`,
              timer: 2000,
              showConfirmButton: false
            });
            this.nuevaCaja = { codigoCaja: '', nombre: '', estado: 'Activa' };
            this.codigoCajaExcede = false;
            this.codigoCajaNoNumerico = false;
            this.estadoInvalido = false;
            this.mostrarFormulario = false;
            setTimeout(() => this.mostrarFormulario = true, 0);
            this.cerrarOffcanvas.emit();
          },
          error: (error) => {
            if (error.status === 404) {
              Swal.fire("No Encontrado", "El Recurso Solicitado NO Existe (404).", "error");
            } else if (error.status === 500) {
              Swal.fire("Error del Servidor", "Ocurrió un Error Interno (500). Intenta más Tarde.", "error");
            } else {
              Swal.fire("Error", error?.error?.message || `Ocurrió un error inesperado (código: ${error.status})`, "error");
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

  onEnterFocus(next: any, event: Event, value?: any) {
    event.preventDefault();
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && !value.trim()) return;
    if (typeof value === 'number' && (!Number.isFinite(value) || value <= 0)) return;

    if (next && typeof next.focus === 'function') {
      next.focus();
      if (typeof next.select === 'function') {
        next.select();
      }
    }
  }
}
