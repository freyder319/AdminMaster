import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
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
  @ViewChild('nombreInput') nombreInput?: ElementRef<HTMLInputElement>;

  constructor(private fb: FormBuilder, private descuentoService: DescuentoService) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      porcentaje: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
      tipo: ['PORCENTAJE'],
      fechaInicio: [null],
      fechaFin: [null],
      activo: [true],
    });
  }

  ngOnInit(): void {
    this.descuentoService.items$.subscribe((list) => (this.descuentos = list));
    this.descuentoService.fetchAll().subscribe();

    // Enfocar automáticamente el nombre del descuento al abrir el offcanvas de descuentos
    setTimeout(() => {
      try {
        const offcanvasEl = document.getElementById('descuentos');
        if (!offcanvasEl) return;
        offcanvasEl.addEventListener('shown.bs.offcanvas', () => {
          setTimeout(() => {
            try {
              const el = this.nombreInput?.nativeElement;
              if (el) {
                el.focus();
                el.select();
              }
            } catch {}
          }, 0);
        });
      } catch {}
    }, 0);
  }

  add() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload: CreateDescuento = {
      nombre: String(v.nombre).trim(),
      porcentaje: Number(v.porcentaje),
      creadoEn: Date.now(),
      tipo: (v.tipo || 'PORCENTAJE') as any,
      fechaInicio: v.fechaInicio ? new Date(v.fechaInicio).getTime() : null,
      fechaFin: v.fechaFin ? new Date(v.fechaFin).getTime() : null,
      activo: !!v.activo,
    };
    this.descuentoService.create(payload).subscribe({
      next: () => {
        this.form.reset();
        Swal.fire({
          icon: 'success',
          title: 'Descuento creado',
          html: 'El <b>Descuento</b> se Creó Correctamente.'
        });
      },
      error: (err) => {
        const msg = (err?.error && (err.error.message || err.error.error)) || 'Intenta Nuevamente.';
        Swal.fire({ icon: 'error', title: 'No se pudo crear', text: msg });
      }
    });
  }

  remove(id: number) {
    Swal.fire({
      title: '¿Eliminar Descuento?',
      text: 'Esta Acción NO se puede Deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.descuentoService.remove(id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Descuento Eliminado',
            html: 'El <b>Descuento</b> se Eliminó Correctamente.'
          });
        },
        error: (err) => {
          const rawMsg = (err?.error && (err.error.message || err.error.error)) || '';
          const msg = String(rawMsg || '').toLowerCase();

          // Caso específico: descuento vinculado/relacionado a una venta
          if (err?.status === 400 || err?.status === 409 || msg.includes('venta') || msg.includes('relacionado')) {
            Swal.fire({
              icon: 'error',
              title: 'No se Puede Eliminar',
              html: 'Este <b>Descuento</b> está Vinculado a una Venta y <b>NO puede ser Eliminado</b>.'
            });
            return;
          }

          // Resto de errores genéricos
          const fallback = rawMsg || 'Intenta Nuevamente.';
          Swal.fire({ icon: 'error', title: 'No se pudo Eliminar', text: fallback });
        }
      });
    });
  }
}
