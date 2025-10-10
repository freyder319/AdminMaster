import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NgClass } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  standalone: true
})
export class ResetPasswordComponent {
  showPassword = false;
  resetForm: FormGroup;
  correo = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });

    this.route.queryParams.subscribe(params => {
      this.correo = params['correo'] || '';
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    const nueva = this.resetForm.value.newPassword;
    const confirmacion = this.resetForm.value.confirmPassword;

    if (this.resetForm.valid && nueva === confirmacion) {
      this.authService.restablecerContrasena(this.correo, nueva).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Contraseña Actualizada',
            html: 'Ahora puedes Iniciar sesión con tu <strong>Nueva Contraseña</strong>',
            timer: 2500,
            showConfirmButton: false,
          }).then(() => {
            this.router.navigate(['/login']).then(() => {
              window.location.reload(); 
            });
          });
        },
        error: () => {
          Swal.fire('Error', 'No se pudo Actualizar la Contraseña', 'error');
        }
      });
    } else {
      Swal.fire('Error', 'Las Contraseñas NO Coinciden o son Inválidas', 'warning');
    }
  }
}

