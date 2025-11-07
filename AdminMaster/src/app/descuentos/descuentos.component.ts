import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DescuentoService, Descuento, CreateDescuento } from '../services/descuento.service';
import Swal from 'sweetalert2';

type LocalDescuento = Descuento;

@Component({
  selector: 'app-descuentos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './descuentos.component.html',
  styleUrl: './descuentos.component.scss'
})
export class DescuentosComponent implements OnInit {
  form: FormGroup;
  descuentos: LocalDescuento[] = [];

  constructor(private fb: FormBuilder, private descuentoService: DescuentoService) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      porcentaje: [null, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    this.descuentoService.items$.subscribe((list) => (this.descuentos = list));
    this.descuentoService.fetchAll().subscribe();
  }

  add() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload: CreateDescuento = {
      nombre: String(v.nombre).trim(),
      porcentaje: Number(v.porcentaje),
      creadoEn: Date.now(),
    };
    this.descuentoService.create(payload).subscribe({
      next: () => {
        this.form.reset();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Descuento creado con éxito',
          showConfirmButton: false,
          timer: 1500
        });
      },
      error: (err) => {
        const msg = (err?.error && (err.error.message || err.error.error)) || 'Intenta nuevamente.';
        Swal.fire({ icon: 'error', title: 'No se pudo crear', text: msg });
      }
    });
  }

  remove(id: number) {
    Swal.fire({
      title: '¿Eliminar descuento?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.descuentoService.remove(id).subscribe({
        next: () => {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Descuento eliminado',
            showConfirmButton: false,
            timer: 1500
          });
        },
        error: (err) => {
          const msg = (err?.error && (err.error.message || err.error.error)) || 'Intenta nuevamente.';
          Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: msg });
        }
      });
    });
  }
}
