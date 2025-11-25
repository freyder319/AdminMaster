import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PqrsService } from '../../services/pqrs.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.scss']
})
export class NotificacionesComponent {
  items: any[] = [];
  cargando = true;
  modalAbierto = false;
  seleccionado: any = null;
  q = '';
  from = '';
  to = '';

  constructor(private pqrs: PqrsService) {
    this.pqrs.obtenerTodas().subscribe(data => {
      this.items = data || [];
      this.cargando = false;
    }, () => {
      this.items = [];
      this.cargando = false;
    });
  }

  abrirDetalle(n: any) {
    try { console.log('[Notificaciones] abrirDetalle', n); } catch {}
    this.seleccionado = n;
    this.modalAbierto = true;
  }

  cerrarDetalle(ev?: Event) {
    try { ev?.preventDefault(); ev?.stopPropagation(); } catch {}
    this.modalAbierto = false;
    this.seleccionado = null;
  }

  get view(): any[] {
    const q = (this.q || '').toLowerCase().trim();
    const from = this.from ? new Date(this.from + 'T00:00:00') : null;
    const to = this.to ? new Date(this.to + 'T23:59:59') : null;
    return (this.items || []).filter(n => {
      const text = [n.nombre, n.apellido, n.correo, n.comentarios].filter(Boolean).join(' ').toLowerCase();
      if (q && !text.includes(q)) return false;
      const dt = n?.fecha ? new Date(n.fecha) : null;
      if (from && dt && dt < from) return false;
      if (to && dt && dt > to) return false;
      return true;
    });
  }
}
