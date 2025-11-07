import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { EmpleadosService } from '../services/empleados.service';
import * as bcrypt from 'bcryptjs';
import { CajasService } from '../services/cajas.service';
declare const bootstrap: any;

@Component({
  selector: 'app-add-empleados',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-empleados.component.html',
  styleUrl: './add-empleados.component.scss'
})
export class AddEmpleadosComponent {
  errorMessage: string = '';
  correoInvalido: boolean = false;
  empleadoExcede: boolean = false;
  empleadoNoNumerico: boolean = false;
  correoDuplicado: boolean = false;
  telefonoDuplicado: boolean = false;
  cajas: any[] = [];

  @Output() empleadoAgregado = new EventEmitter();

  empleado = {
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    contrasena: '',
    cajaId: null as number | null
  };

  constructor(
    private empleadosServices: EmpleadosService,
    private cajasService: CajasService
  ) {}

  ngOnInit(): void {
    this.cajasService.getCajas().subscribe({
      next: (data) => {
        this.cajas = (data || []).filter(c => String((c?.estado || '')).toLowerCase() === 'activo');
      },
      error: (err) => {
        console.error('Error al cargar cajas:', err);
      }
    });
  }

  private closeOffcanvasIfAny() {
    try {
      const el = document.getElementById('offcanvasAddEmpleado');
      if (!el) return;
      const instance = bootstrap?.Offcanvas?.getInstance(el) || new bootstrap.Offcanvas(el);
      instance?.hide();
    } catch {}
  }

  agregarEmpleado(form: NgForm) {
    if (!form.valid) {
      Swal.fire({
        title: "Formulario inválido",
        icon: "warning",
        text: "Por favor completa todos los campos correctamente.",
        confirmButtonText: "Entendido"
      });
      return;
    }

    const { nombre, apellido, correo, telefono, contrasena } = this.empleado;

    if (!nombre || !apellido || !correo || !telefono || !contrasena) {
      Swal.fire({
        title: "Campos incompletos",
        icon: "warning",
        text: "Todos los campos (nombre, apellido, correo, teléfono, contraseña y caja) son obligatorios.",
        confirmButtonText: "Ok"
      });
      return;
    }

    // Validar caja activa seleccionada
    const cajaId = this.empleado.cajaId;
    const cajaSel = this.cajas.find(c => c.id === cajaId);
    if (!cajaId || !cajaSel) {
      Swal.fire({ title: 'Caja requerida', icon: 'warning', text: 'Debes seleccionar una caja activa.' });
      return;
    }

    this.empleadosServices.verificarExistencia(correo, telefono).subscribe({
      next: (existe) => {
        if (existe.correo) {
          Swal.fire({
            title: "Correo ya registrado",
            icon: "error",
            text: `El correo ${correo} ya está en uso.`,
            confirmButtonText: "Cambiar correo"
          });
          return;
        }

        if (existe.telefono) {
          Swal.fire({
            title: "Teléfono ya registrado",
            icon: "error",
            text: `El teléfono ${telefono} ya está en uso.`,
            confirmButtonText: "Cambiar teléfono"
          });
          return;
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(contrasena, salt);

        const empleadoFinal = {
          ...this.empleado,
          contrasena: hashedPassword
        };

        this.empleadosServices.createEmpleado(empleadoFinal).subscribe({
          next: () => {
            Swal.fire({
              title: "Empleado Registrado!",
              icon: "success",
              html: `El Empleado <b>${correo}</b> fue Registrado con Éxito`,
              timer: 2500,
              showConfirmButton: false
            });

            // Cerrar offcanvas si existe (vista escritorio)
            this.closeOffcanvasIfAny();

            this.empleado = {
              nombre: '',
              apellido: '',
              telefono: '',
              correo: '',
              contrasena: '',
              cajaId: null
            };

            form.resetForm();
            this.empleadoAgregado.emit();
          },
          error: (err) => {
            console.error(err);
            this.errorMessage = err.status === 400 ? err.error.message : 'Error inesperado';
            Swal.fire({
              title: "Error al registrar",
              icon: "error",
              text: this.errorMessage,
              confirmButtonText: "Cerrar"
            });
          }
        });
      },
      error: () => {
        Swal.fire({
          title: "Error de validación",
          icon: "error",
          text: "No se pudo verificar la existencia del empleado.",
          confirmButtonText: "Cerrar"
        });
      }
    });
  }


  validarCorreo() {
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.correoInvalido = this.empleado.correo
      ? !regexCorreo.test(this.empleado.correo)
      : false;

    // Verificar duplicados si formato válido y hay teléfono para consulta conjunta
    if (!this.correoInvalido) {
      const correo = this.empleado.correo || '';
      const telefono = this.empleado.telefono || '';
      if (correo || telefono) {
        this.empleadosServices.verificarExistencia(correo, telefono).subscribe({
          next: (existe) => {
            this.correoDuplicado = !!correo && existe.correo;
            this.telefonoDuplicado = !!telefono && existe.telefono;
          },
          error: () => {
            this.correoDuplicado = false;
            this.telefonoDuplicado = false;
          }
        });
      }
    }
  }

  validarTelefono() {
    const soloNumeros = /^[0-9]*$/.test(this.empleado.telefono);
    this.empleadoNoNumerico = !soloNumeros;
    this.empleadoExcede = this.empleado.telefono.length > 10;

    // Verificar duplicados si cumple reglas básicas
    if (!this.empleadoNoNumerico && !this.empleadoExcede) {
      const correo = this.empleado.correo || '';
      const telefono = this.empleado.telefono || '';
      if (correo || telefono) {
        this.empleadosServices.verificarExistencia(correo, telefono).subscribe({
          next: (existe) => {
            this.correoDuplicado = !!correo && existe.correo;
            this.telefonoDuplicado = !!telefono && existe.telefono;
          },
          error: () => {
            this.correoDuplicado = false;
            this.telefonoDuplicado = false;
          }
        });
      }
    }
  }
}
