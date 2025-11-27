import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventEmitter, Output } from '@angular/core';
import { ProveedorService } from '../services/proveedor.service';

@Component({
  selector: 'app-add-proveedor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add_proveedor.component.html',
  styleUrls: ['./add_proveedor.component.scss']
})
export class AddProveedorComponent {
  @Output() crear = new EventEmitter<{ nombreEmpresa?: string; nit?: string; contactoNombre?: string; telefono: string; correo: string; activo: boolean }>();

  form: FormGroup;
  telefonoDuplicado = false;
  correoDuplicado = false;
  nitDuplicado = false;

  constructor(private fb: FormBuilder, private proveedorService: ProveedorService) {
    this.form = this.fb.group({
      nombreEmpresa: ['', [Validators.maxLength(150)]],
      nit: ['', [Validators.maxLength(30)]],
      contactoNombre: ['', [Validators.maxLength(150)]],
      telefono: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[0-9]{1,10}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      activo: [true]
    });

    this.form.get('telefono')!.valueChanges.subscribe((tel: string) => {
      const v = (tel || '').trim();
      this.telefonoDuplicado = !!v && this.proveedorService.snapshot.some(p => p.telefono === v);
    });

    this.form.get('nit')!.valueChanges.subscribe((doc: string) => {
      const v = (doc || '').trim();
      this.nitDuplicado = !!v && this.proveedorService.snapshot.some(p => (p.nit || '') === v);
    });

    this.form.get('correo')!.valueChanges.subscribe((mail: string) => {
      const v = (mail || '').trim().toLowerCase();
      this.correoDuplicado = !!v && this.proveedorService.snapshot.some(p => (p.correo || '').toLowerCase() === v);
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.telefonoDuplicado || this.correoDuplicado) return;
    this.crear.emit(this.form.value);
    this.form.reset({ activo: true });
    this.telefonoDuplicado = false;
    this.correoDuplicado = false;
  }

  onEnterFocus(next: any, event: Event, value?: any) {
    event.preventDefault();

    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === 'string' && !value.trim()) {
      return;
    }
    if (typeof value === 'number' && (!Number.isFinite(value) || value <= 0)) {
      return;
    }

    if (next && typeof next.focus === 'function') {
      next.focus();
      if (typeof next.select === 'function') {
        next.select();
      }
    }
  }
}
