import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { EmpleadosService } from '../services/empleados.service';
import * as bcrypt from 'bcryptjs';
import { CajasService } from '../services/cajas.service';

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
  cajas: any[] = [];

  @Output() empleadoAgregado = new EventEmitter();

  empleado = {
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
        this.cajas = data;
      },
      error: (err) => {
        console.error('Error al cargar cajas:', err);
      }
    });
  }

  agregarEmpleado(form: NgForm) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(this.empleado.contrasena, salt);

    const empleadoFinal = {
      ...this.empleado,
      contrasena: hashedPassword
    };

    this.empleadosServices.createEmpleado(empleadoFinal).subscribe({
      next: () => {
        Swal.fire({
          title: "Empleado Registrado!",
          icon: "success",
          html: `El Empleado <b>${this.empleado.correo}</b> fue Registrado con Éxito`,
          timer: 2500,
          showConfirmButton: false
        });

        this.empleado = {
          telefono: '',
          correo: '',
          contrasena: '',
          cajaId: null as number | null
        };

        form.resetForm();
        this.empleadoAgregado.emit();
      },
      error: (err) => {
        console.log(err);
        this.errorMessage = err.status === 400 ? err.error.message : 'Error inesperado';
        Swal.fire({
          title: "Error",
          icon: "error",
          text: this.errorMessage
        });
      }
    });
  }

  validarCorreo() {
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.correoInvalido = this.empleado.correo
      ? !regexCorreo.test(this.empleado.correo)
      : false;
  }

  validarTelefono() {
    const soloNumeros = /^[0-9]*$/.test(this.empleado.telefono);
    this.empleadoNoNumerico = !soloNumeros;
    this.empleadoExcede = this.empleado.telefono.length > 10;
  }
}
