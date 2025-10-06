import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-login-punto-pos',
  standalone: true,
  imports: [ReactiveFormsModule,RouterLink],
  templateUrl: './login_punto_venta.component.html',
  styleUrls: ['./login_punto_venta.component.scss']
})
export class LoginPuntoVentaComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {
    this.loginForm = this.fb.group({
      codigoCaja: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Campo Inválido',
        text: 'Ingresa un Código de Caja válido.',
        confirmButtonColor: 'brown'
      });
      return;
    }

    const { codigoCaja } = this.loginForm.value;

    this.auth.loginPuntoPos(codigoCaja).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('rol', res.rol);
        localStorage.setItem('cajaId', `${res.cajaId}`);

        Swal.fire({
          position: "top",
          icon: 'success',
          title: '¡Bienvenido!',
          text: `Caja: ${codigoCaja}`,
          showConfirmButton: false,
          timer: 1000,
          showClass: {
            popup: `animate__animated animate__fadeInUp animate__faster`
          },
          hideClass: {
            popup: `animate__animated animate__fadeOutDown animate__faster`
          }
        }).then(() => this.router.navigate(['/movimientos']));
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'Código inválido o sin usuario punto_pos.',
          confirmButtonColor: 'brown'
        });
      }
    });
  }
}

