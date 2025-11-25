import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { EmpleadosService } from '../services/empleados.service';
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
  documentoExcede: boolean = false;
  documentoNoNumerico: boolean = false;
  documentoDuplicado: boolean = false;
  cajas: any[] = [];
  activo: boolean = true;
  mostrarContrasena: boolean = false;

  @Output() empleadoAgregado = new EventEmitter();

  empleado = {
    nombre: '',
    apellido: '',
    documento: '',
    telefono: '',
    correo: '',
    cajaId: null as number | null
  };

  constructor(
    private empleadosServices: EmpleadosService,
    private cajasService: CajasService
  ) {}

  ngOnInit(): void {
    this.cajasService.getCajas().subscribe({
      next: (data) => {
        this.cajas = (data || []).filter(c => String((c?.estado || '')).toLowerCase() === 'activa');
        this.validarDocumento();
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
        title: "Formulario Inválido",
        icon: "warning",
        text: "Por favor Completa todos los <b>Campos</b> Correctamente.",
        confirmButtonText: "Entendido"
      });
      return;
    }

    const { nombre, apellido, correo, telefono } = this.empleado;

    if (!nombre || !apellido || !correo || !telefono || !this.empleado.documento) {
      Swal.fire({
        title: "Campos Incompletos",
        icon: "warning",
        text: "Todos los Campos (nombre, apellido, correo, teléfono, contraseña y caja) son Obligatorios.",
        confirmButtonText: "Ok"
      });
      return;
    }

    // Validar caja según estado
    const cajaId = this.empleado.cajaId;
    const cajaSel = this.cajas.find(c => c.id === cajaId);
    if (this.activo) {
      if (!cajaId || !cajaSel) {
        Swal.fire({ title: 'Caja Requerida', icon: 'warning', html: 'Debes Seleccionar una <b>Caja Activa</b>.' });
        return;
      }
    } else {
      // si inactivo, no se requiere caja
      this.empleado.cajaId = null;
    }

    this.empleadosServices.verificarExistencia(correo, telefono, this.empleado.documento).subscribe({
      next: (existe) => {
        if (existe.correo) {
          Swal.fire({
            title: "Correo ya Registrado",
            icon: "error",
            html: `El Correo <b>${correo}</b> ya está en Uso.`,
            confirmButtonText: "Cambiar Correo"
          });
          return;
        }

        if (existe.telefono) {
          Swal.fire({
            title: "Teléfono ya Registrado",
            icon: "error",
            text: `El Teléfono <b>${telefono}</b> ya está en Uso.`,
            confirmButtonText: "Cambiar Teléfono"
          });
          return;
        }

        if (existe.documento) {
          Swal.fire({
            title: "Documento ya Registrado",
            icon: "error",
            html: `El Documento <b>${this.empleado.documento}</b> ya está en Uso.`,
            confirmButtonText: "Cambiar Documento"
          });
          return;
        }

        const empleadoFinal = {
          ...this.empleado,
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
              documento: '',
              telefono: '',
              correo: '',
              cajaId: null
            };
            this.activo = true;

            // Enviar correo de activación para que el empleado defina su contraseña
            this.empleadosServices.enviarCorreoActivacion(correo).subscribe({
              next: () => {},
              error: (e) => console.error('Error al enviar correo de activación:', e)
            });

            form.resetForm();
            this.empleadoAgregado.emit();
          },
          error: (err) => {
            console.error(err);
            this.errorMessage = err.status === 400 ? err.error.message : 'Ocurrió un error inesperado';
            Swal.fire({
              title: "Error al Registrar",
              icon: "error",
              text: this.errorMessage,
              confirmButtonText: "Cerrar"
            });
          }
        });
      },
      error: () => {
        Swal.fire({
          title: "Error de Validación",
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
      const documento = this.empleado.documento || '';
      if (correo || telefono || documento) {
        this.empleadosServices.verificarExistencia(correo, telefono, documento).subscribe({
          next: (existe) => {
            this.correoDuplicado = !!correo && existe.correo;
            this.telefonoDuplicado = !!telefono && existe.telefono;
            this.documentoDuplicado = !!documento && existe.documento;
          },
          error: () => {
            this.correoDuplicado = false;
            this.telefonoDuplicado = false;
            this.documentoDuplicado = false;
          }
        });
      }
    }
  }

  validarDocumento() {
    const valor = this.empleado.documento || '';
    const soloNumeros = /^[0-9]*$/.test(valor);
    this.documentoNoNumerico = !soloNumeros;
    this.documentoExcede = valor.length > 15;

    if (!this.documentoNoNumerico && !this.documentoExcede) {
      const correo = this.empleado.correo || '';
      const telefono = this.empleado.telefono || '';
      const documento = valor;
      if (correo || telefono || documento) {
        this.empleadosServices.verificarExistencia(correo, telefono, documento).subscribe({
          next: (existe) => {
            this.correoDuplicado = !!correo && existe.correo;
            this.telefonoDuplicado = !!telefono && existe.telefono;
            this.documentoDuplicado = !!documento && existe.documento;
          },
          error: () => {
            this.correoDuplicado = false;
            this.telefonoDuplicado = false;
            this.documentoDuplicado = false;
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
      const documento = this.empleado.documento || '';
      if (correo || telefono || documento) {
        this.empleadosServices.verificarExistencia(correo, telefono, documento).subscribe({
          next: (existe) => {
            this.correoDuplicado = !!correo && existe.correo;
            this.telefonoDuplicado = !!telefono && existe.telefono;
            this.documentoDuplicado = !!documento && existe.documento;
          },
          error: () => {
            this.correoDuplicado = false;
            this.telefonoDuplicado = false;
            this.documentoDuplicado = false;
          }
        });
      }
    }
  }

  toggleMostrarContrasena() {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  onEnterFocus(next: any, event: Event, value?: any) {
    event.preventDefault();

    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === 'string' && !value.trim()) {
      return;
    }
    if (typeof value === 'number' && (!Number.isFinite(value) || value <= 0)) {
      return;
    }

    if (next && typeof next.focus === 'function') {
      next.focus();
      if (typeof next.select === 'function') {
        next.select();
      }
    }
  }
}
