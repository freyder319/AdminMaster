import { Component, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryService, AuditLogDto } from '../../services/history.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.scss']
})
export class HistorialComponent implements OnDestroy {
  items: AuditLogDto[] = [];
  cargando = true;
  private sub?: Subscription;
  modalAbierto = false;
  seleccionado: AuditLogDto | null = null;
  q = '';
  from = '';
  to = '';
  
  private readonly actionMap: Record<string, string> = {
    create: 'Crear',
    update: 'Modificar',
    delete: 'Eliminar',
    remove: 'Eliminar',
    edit: 'Modificar',
    view: 'Ver',
    read: 'Ver',
    login: 'Inicio de sesión',
    logout: 'Cierre de sesión',
    assign: 'Asignar',
    unassign: 'Desasignar',
    export: 'Exportar',
    import: 'Importar',
  };

  tAction(a?: string): string {
    const k = (a || '').toLowerCase();
    return this.actionMap[k] || a || '—';
  }

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

  cerrarDetalle(ev?: Event) {
    try { ev?.preventDefault(); (ev as any)?.stopImmediatePropagation?.(); ev?.stopPropagation(); } catch {}
    setTimeout(() => {
      this.modalAbierto = false;
      this.seleccionado = null;
    }, 0);
  }

  get view(): AuditLogDto[] {
    const q = (this.q || '').toLowerCase().trim();
    const from = this.from ? new Date(this.from + 'T00:00:00') : null;
    const to = this.to ? new Date(this.to + 'T23:59:59') : null;
    return (this.items || []).filter(ev => {
      const text = [ev.module, ev.action, ev.entity, ev.entityId].filter(Boolean).join(' ').toLowerCase();
      if (q && !text.includes(q)) return false;
      const dt = ev?.timestamp ? new Date(ev.timestamp) : null;
      if (from && dt && dt < from) return false;
      if (to && dt && dt > to) return false;
      return true;
    });
  }
}

