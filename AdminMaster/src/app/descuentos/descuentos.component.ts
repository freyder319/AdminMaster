import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

type Descuento = {
  id: string;
  nombre: string;
  porcentaje: number; // 1 - 100
  creadoEn: number;
};

@Component({
  selector: 'app-descuentos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './descuentos.component.html',
  styleUrl: './descuentos.component.scss'
})
export class DescuentosComponent {
  form: FormGroup;
  descuentos: Descuento[] = [];
  private readonly KEY = 'admin_descuentos';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      porcentaje: [null, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      this.descuentos = raw ? JSON.parse(raw) : [];
    } catch {
      this.descuentos = [];
    }
  }

  private persist() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.descuentos)); } catch {}
  }

  add() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const nuevo: Descuento = {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      nombre: String(v.nombre).trim(),
      porcentaje: Number(v.porcentaje),
      creadoEn: Date.now()
    };
    this.descuentos = [nuevo, ...this.descuentos];
    this.persist();
    this.form.reset();
  }

  remove(id: string) {
    this.descuentos = this.descuentos.filter(d => d.id !== id);
    this.persist();
  }
}
