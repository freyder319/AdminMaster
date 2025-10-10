import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service'; 
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-security-email',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './security_email.component.html',
  styleUrl: './security_email.component.scss'
})
export class SecurityEmailComponent implements OnInit {
  form: FormGroup;
  correoOculto = '';
  correoReal = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      codigo0: ['', [Validators.required]],
      codigo1: ['', [Validators.required]],
      codigo2: ['', [Validators.required]],
      codigo3: ['', [Validators.required]],
      codigo4: ['', [Validators.required]],
      codigo5: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.correoReal = params['correo'];
      this.correoOculto = this.ocultarCorreo(this.correoReal);
    });
  }

  ocultarCorreo(correo: string): string {
    const [nombre, dominio] = correo.split('@');
    const oculto = nombre.slice(0, 1) + '******' + nombre.slice(-1);
    return `${oculto}@${dominio}`;
  }

  autoFocusSiguiente(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (value.length === 1 && index < 5) {
      const next = document.querySelector(`input[formcontrolname='codigo${index + 1}']`) as HTMLElement;
      next?.focus();
    }
    if (event.key === 'Backspace' && !value && index > 0) {
      const prev = document.querySelector(`input[formcontrolname='codigo' + (index - 1)]`) as HTMLElement;
      prev?.focus();
    }
  }

  verificarCodigo() {
    const codigo = Object.values(this.form.value).join('');
    this.authService.verificarCodigoCorreo(this.correoReal, codigo).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Código Verificado',
          html: 'Ahora puedes <strong>Restablecer tu Contraseña</strong>',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          this.router.navigate(['/restablecer-contrasena'], {
            queryParams: { correo: this.correoReal }
          });
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Código Incorrecto',
          text: 'Verifica que el código sea correcto',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    });
  }
}


