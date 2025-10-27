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
        const rol = (res.rol || '').trim().toLowerCase();
        localStorage.setItem('rol', rol);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Sesión iniciada correctamente',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
          }
        }).then(() => this.redirigirPorRol(rol));
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
        this.router.navigate(['/turno-empleado']);
        break;
      default:
        this.router.navigate(['/login']);
        break;
    }
  }
}

