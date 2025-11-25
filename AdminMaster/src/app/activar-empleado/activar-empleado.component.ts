import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-activar-empleado',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgClass],
  templateUrl: './activar-empleado.component.html',
  styleUrl: './activar-empleado.component.scss'
})
export class ActivarEmpleadoComponent {
  form: FormGroup;
  correo = '';
  codigo = '';
  mostrarPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.pattern(/^(?=(?:.*\d){4,})(?=(?:.*[A-Za-z]){6,})[^\s]{10,}$/)
      ]],
      confirmPassword: ['', [Validators.required]],
    });

    this.route.queryParams.subscribe(params => {
      this.correo = (params['correo'] || '').trim().toLowerCase();
      this.codigo = (params['codigo'] || '').toString().trim().toUpperCase();
    });
  }

  toggleMostrarPassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const password = this.form.value.password;
    const confirm = this.form.value.confirmPassword;

    if (password !== confirm) {
      Swal.fire('Error', 'Las Contraseñas no Coinciden.', 'warning');
      return;
    }

    if (!this.correo || !this.codigo) {
      Swal.fire('Error', 'El <b>Enlace de Activación</b> es Inválido o está Incompleto.', 'error');
      return;
    }

    this.authService.activarEmpleado(this.correo, this.codigo, password).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Cuenta Activada',
          html: 'Tu <b>Cuenta ha sido Activada</b> y tu <b>Contraseña fue Creada Correctamente</b>.',
          timer: 2500,
          showConfirmButton: false,
        }).then(() => {
          this.router.navigate(['/login'], { replaceUrl: true });
        });
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'No se pudo Activar la Cuenta. Verifica el Enlace o Vuelve a Intentarlo.';
        Swal.fire('Error', msg, 'error');
      }
    });
  }
}
