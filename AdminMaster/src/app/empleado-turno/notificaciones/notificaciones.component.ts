import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PqrsService } from '../../services/pqrs.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.scss']
})
export class NotificacionesComponent {
  items: any[] = [];
  cargando = true;
  modalAbierto = false;
  seleccionado: any = null;

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
    this.seleccionado = n;
    this.modalAbierto = true;
  }

  cerrarDetalle() {
    this.modalAbierto = false;
    this.seleccionado = null;
  }
}
