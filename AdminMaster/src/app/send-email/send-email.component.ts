import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PasswordRecoveryFlowService } from '../services/password-recovery-flow.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-send-email',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './send-email.component.html',
  styleUrl: './send-email.component.scss'
})
export class SendEmailComponent {
  emailForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private recoveryFlow: PasswordRecoveryFlowService) {
    this.emailForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]]
    });
  }

  enviarCodigo() {
    const correo = this.emailForm.value.correo;
    console.log('Correo a enviar:', correo);

    if (!correo || this.emailForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Correo inválido',
        text: 'Por favor ingresa un correo válido.',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    this.authService.recuperarPorCorreo(correo).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Código enviado',
          html: `Se ha enviado un código de verificación a <strong>${this.ocultarCorreo(correo)}</strong><br><small>Este código expira en 5 minutos.</small>`,
          timer: 3000,
          showConfirmButton: false
        }).then(() => {
          this.recoveryFlow.setEmailSent(correo);
          this.router.navigate(['/recuperar-email'], {
            queryParams: { correo },
            replaceUrl: true
          });
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Correo no registrado',
          text: 'Este correo no está asociado a ningún usuario.',
          confirmButtonColor: 'brown'
        });
      }
    });
  }

  ocultarCorreo(correo: string): string {
    const [nombre, dominio] = correo.split('@');
    const oculto = nombre.slice(0, 1) + '******' + nombre.slice(-1);
    return `${oculto}@${dominio}`;
  }
}

