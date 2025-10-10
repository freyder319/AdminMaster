import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  showPassword = false;
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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
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
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: '¡Bienvenido!',
          text: 'Has iniciado sesión exitosamente',
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true,
          customClass: {
            popup: 'custom-toast',
            title: 'custom-title',
            icon: 'custom-icon'
          },
          showClass: {
            popup: 'animate__animated animate__fadeInDown animate__faster'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp animate__faster'
          }
        }).then(() => this.redirigirPorRol(res.rol));
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

  redirigirPorRol(rol: string) {
    switch (rol) {
      case 'admin':
        this.router.navigate(['/movimientos']);
        break;
      case 'punto_pos':
        this.router.navigate(['/movimientos']);
        break;
      default:
        this.router.navigate(['/login']);
        break;
    }
  }
}

