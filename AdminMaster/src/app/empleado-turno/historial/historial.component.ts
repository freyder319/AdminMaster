import { Component, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryService, AuditLogDto } from '../../services/history.service';
import { Subscription } from 'rxjs';
import { AgenteIAComponent } from "../../agente-ia/agente-ia.component";

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, AgenteIAComponent],
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
    try { console.log('[Historial] abrirDetalle', ev); } catch {}
    this.seleccionado = ev;
    this.modalAbierto = true;
  }

  cerrarDetalle(ev?: Event) {
    try { ev?.preventDefault(); ev?.stopPropagation(); } catch {}
    this.modalAbierto = false;
    this.seleccionado = null;
  }

  isProducto(ev?: AuditLogDto | null): boolean {
    const entidad = (ev?.entity || '').toLowerCase();
    const modulo = (ev?.module || '').toLowerCase();
    return entidad === 'producto' || modulo === 'producto';
  }

  displayEntityId(ev?: AuditLogDto | null): string | null {
    if (!ev) return null;
    // Si es producto, intentar usar un posible código en details
    if (this.isProducto(ev)) {
      const d: any = ev.details || {};
      const code = d?.codigo || d?.code || d?.sku || null;
      if (code != null) return String(code);
    }
    return ev.entityId ?? null;
  }

  displayUsuario(ev?: AuditLogDto | null): string {
    if (!ev) return '—';
    const d: any = ev.details || {};
    // Preferir nombre completo enriquecido desde el backend
    const actorNombre: string | undefined = d.actorNombre;
    if (actorNombre && actorNombre.trim().length > 0) return actorNombre.trim();

    const actorUser: any = d.actorUser || {};
    const nombre = actorUser.nombre;
    const apellido = actorUser.apellido;
    if (nombre || apellido) {
      return `${nombre || ''} ${apellido || ''}`.trim();
    }

    if (ev.actorUserId != null) return String(ev.actorUserId);
    return '—';
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

  openDatePicker(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.type === 'date') {
      // Remover readonly temporalmente para permitir la interacción
      input.removeAttribute('readonly');
      // Hacer foco y mostrar el picker
      input.focus();
      input.showPicker?.();
      // Restaurar readonly después de un pequeño delay
      setTimeout(() => {
        input.setAttribute('readonly', 'true');
      }, 100);
    }
  }
}

