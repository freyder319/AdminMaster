import { Component, OnInit, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service'; 
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Router, ActivatedRoute } from '@angular/router';
import { PasswordRecoveryFlowService } from '../services/password-recovery-flow.service';

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
  @ViewChildren('otp') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private recoveryFlow: PasswordRecoveryFlowService
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
    // Si no se envió email, redirigir al inicio del flujo
    if (!this.recoveryFlow.isEmailSent()) {
      this.router.navigate(['/verificar-email'], { replaceUrl: true });
      return;
    }
    // Si expiró, forzar reinicio de flujo
    if (this.recoveryFlow.isExpired()) {
      Swal.fire({ icon: 'warning', title: 'Código expirado', text: 'El código de verificación expiró. Solicita uno nuevo.' });
      this.router.navigate(['/verificar-email'], { replaceUrl: true });
      return;
    }
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
      const next = this.otpInputs?.toArray()?.[index + 1]?.nativeElement;
      next?.focus();
    }
    if (event.key === 'Backspace' && !value && index > 0) {
      const prev = this.otpInputs?.toArray()?.[index - 1]?.nativeElement;
      prev?.focus();
    }
  }

  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    // Permitir sólo 1 carácter alfanumérico y avanzar
    const cleaned = (input.value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const char = cleaned.slice(0, 1);
    this.form.get('codigo' + index)?.setValue(char);
    input.value = char;
    if (char && index < 5) {
      const next = this.otpInputs?.toArray()?.[index + 1]?.nativeElement;
      next?.focus();
      next?.select?.();
    } else if (!char && index > 0) {
      const prev = this.otpInputs?.toArray()?.[index - 1]?.nativeElement;
      prev?.focus();
      prev?.select?.();
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const text = (event.clipboardData?.getData('text') || '').replace(/[^a-zA-Z0-9]/g, '');
    if (!text) return;
    const chars = text.slice(0, 6).split('');
    for (let i = 0; i < 6; i++) {
      const v = chars[i] || '';
      this.form.get('codigo' + i)?.setValue(v);
    }
    // Enfocar el siguiente vacío o el último
    let focusIndex = chars.length >= 6 ? 5 : chars.length;
    const target = this.otpInputs?.toArray()?.[focusIndex]?.nativeElement;
    target?.focus();
    target?.select?.();
  }

  verificarCodigo() {
    // Validación rápida por expiración
    if (this.recoveryFlow.isExpired()) {
      Swal.fire({ icon: 'warning', title: 'Código expirado', text: 'El código de verificación expiró. Solicita uno nuevo.' });
      this.router.navigate(['/verificar-email'], { replaceUrl: true });
      return;
    }
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
          this.recoveryFlow.setCodeVerified();
          this.router.navigate(['/restablecer-contrasena'], {
            queryParams: { correo: this.correoReal },
            replaceUrl: true
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


