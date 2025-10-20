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
  @Output() crear = new EventEmitter<{ nombre: string; apellido: string; telefono: string; correo: string; activo: boolean }>();

  form: FormGroup;
  telefonoDuplicado = false;
  correoDuplicado = false;

  constructor(private fb: FormBuilder, private proveedorService: ProveedorService) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      apellido: ['', [Validators.maxLength(100)]],
      telefono: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[0-9]{1,10}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      activo: [true]
    });

    this.form.get('telefono')!.valueChanges.subscribe((tel: string) => {
      const v = (tel || '').trim();
      this.telefonoDuplicado = !!v && this.proveedorService.snapshot.some(p => p.telefono === v);
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
}
