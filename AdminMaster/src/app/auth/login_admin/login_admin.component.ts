import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-login-admin',
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './login_admin.component.html',
  styleUrls: ['./login_admin.component.scss'],
  standalone: true
})
export class LoginAdminComponent {
  showPassword = false;
  
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Campos Inválidos',
        text: 'Revisa tu Correo y Contraseña.',
        confirmButtonColor: 'brown'
      });
      return;
    }

    const { correo, password } = this.loginForm.value;

    this.auth.login(correo, password).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('rol', res.rol);

        Swal.fire({
          position: "top",
          icon: 'success',
          title: '¡Bienvenido!',
          text: 'Acceso Concedido como Administrador.',
          showConfirmButton: false,
          timer: 1000,
            showClass: {
              popup: `
                animate__animated
                animate__fadeInUp
                animate__faster
              `
            },
            hideClass: {
              popup: `
                animate__animated
                animate__fadeOutDown
                animate__faster
              `
            }
        }).then(() => this.router.navigate(['/movimientos']));
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error de Autenticación',
          text: 'Credenciales Inválidas.',
          confirmButtonColor: 'brown'
        });
      }
    });
  }
}

