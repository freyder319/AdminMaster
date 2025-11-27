import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventEmitter, Output } from '@angular/core';
import { Proveedor } from '../services/proveedor.service';

@Component({
  selector: 'app-modify-proveedor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modify-proveedor.component.html',
  styleUrls: ['./modify-proveedor.component.scss']
})
export class ModifyProveedorComponent implements OnChanges {
  @Input() proveedor: Proveedor | null = null;
  @Output() guardar = new EventEmitter<Partial<Proveedor>>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombreEmpresa: ['', [Validators.maxLength(150)]],
      nit: ['', [Validators.maxLength(30)]],
      contactoNombre: ['', [Validators.maxLength(150)]],
      telefono: ['', [Validators.required, Validators.maxLength(20)]],
      correo: ['', [Validators.required, Validators.email]],
      activo: [true]
    });
  }

  ngChangesPatched = false;
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['proveedor'] && this.proveedor) {
      const { nombreEmpresa, nit, contactoNombre, telefono, correo, activo } = this.proveedor;
      this.form.patchValue({ nombreEmpresa, nit, contactoNombre, telefono, correo, activo });
      this.ngChangesPatched = true;
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.proveedor) return;
    this.guardar.emit(this.form.value);
  }
}
