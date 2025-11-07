import { Component } from '@angular/core';
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { FooterComponent } from "../footer/footer.component";
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PqrsService } from '../services/pqrs.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pqrs',
  standalone: true,
  imports: [NavBarComponent, FooterComponent, RouterModule, ReactiveFormsModule, CommonModule],
  templateUrl: './pqrs.component.html',
  styleUrls: ['./pqrs.component.scss']
})
export class PqrsComponent {
  submitted = false;
  form!: FormGroup;

  constructor(private fb: FormBuilder, private pqrsService: PqrsService) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(80)]],
      numero: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      comentarios: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      autorizo: [false, [Validators.requiredTrue]],
    });
  }

  get f() { return this.form.controls; }

  onNumeroInput(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    const digits = (inputEl.value || '').replace(/\D/g, '').slice(0, 10);
    if (inputEl.value !== digits) {
      this.f['numero'].setValue(digits, { emitEvent: false });
    }
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const data = this.form.getRawValue();
    this.pqrsService.crearPqrs({
      nombre: data.nombre!,
      apellido: data.apellido!,
      correo: data.correo!,
      numero: data.numero!,
      comentarios: data.comentarios!,
      autorizo: data.autorizo!,
    }).subscribe({
      next: () => {
        this.form.reset({ autorizo: false });
        this.submitted = false;
        Swal.fire({
          icon: 'success',
          title: 'Enviado',
          text: '¡Gracias! Tu PQRS fue enviada correctamente.',
          confirmButtonColor: '#772929'
        });
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'No se pudo enviar',
          text: 'Ocurrió un error al enviar tu PQRS. Intenta nuevamente.',
          confirmButtonColor: '#772929'
        });
      }
    });
  }
}
