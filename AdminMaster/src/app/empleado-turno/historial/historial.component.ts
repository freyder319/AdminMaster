import { Component, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HistoryService, AuditLogDto } from '../../services/history.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.scss']
})
export class HistorialComponent implements OnDestroy {
  items: AuditLogDto[] = [];
  cargando = true;
  private sub?: Subscription;
  modalAbierto = false;
  seleccionado: AuditLogDto | null = null;

  constructor(private history: HistoryService) {
    this.sub = this.history.watchLatest().subscribe(items => {
      // ocultar pqrs
      this.items = (items || []).filter(ev => (ev?.module || '').toLowerCase() !== 'pqrs');
      this.cargando = false;
    });
  }

  ngOnDestroy(): void {
    try { this.sub?.unsubscribe(); } catch {}
  }

  abrirDetalle(ev: AuditLogDto) {
    this.seleccionado = ev;
    this.modalAbierto = true;
  }

  cerrarDetalle() {
    this.modalAbierto = false;
    this.seleccionado = null;
  }
}
