import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import Swal from 'sweetalert2';

export interface TurnoDiaItem {
  id: number;
  fecha: string; // YYYY-MM-DD
  bloque: 'manana' | 'tarde' | 'noche';
  notas?: string;
  horaDesde?: string;
  horaHasta?: string;
  createdAt?: string | Date;
  estado?: 'por_cumplir' | 'pendiente' | 'cumplido' | 'incumplido';
  observacionEstado?: string;
}

@Component({
  selector: 'app-turnos-dia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos-dia.component.html',
  styleUrls: ['./turnos-dia.component.scss']
})
export class TurnosDiaComponent implements OnInit {
  private apiUrl = 'http://localhost:3000/turno/registro';

  fechaSeleccionada: string = '';
  minFecha: string = '';
  fechaConsulta: string = '';
  bloque: 'manana' | 'tarde' | 'noche' = 'manana';
  notas: string = '';
  horaDesde: string = '';
  horaHasta: string = '';

  turnos: TurnoDiaItem[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.minFecha = this.hoyIso();
    this.fechaSeleccionada = this.minFecha;
    this.onJornadaChange(this.bloque);
    this.cargarDesdeBackend();
  }

  private hoyIso(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private cargarDesdeBackend(): void {
    const fecha = (this.fechaConsulta || this.fechaSeleccionada || '').trim();
    if (!fecha) {
      this.turnos = [];
      return;
    }
    const params = new HttpParams().set('fecha', fecha);
    this.http.get<TurnoDiaItem[]>(this.apiUrl, { params }).subscribe({
      next: (data) => {
        this.turnos = Array.isArray(data) ? data : [];
      },
      error: () => {
        this.turnos = [];
      }
    });
  }

  onFechaChange(): void {
    this.cargarDesdeBackend();
  }

  onFechaConsultaChange(): void {
    // Cuando cambie la fecha de consulta volvemos a cargar desde backend
    this.cargarDesdeBackend();
  }

  onJornadaChange(value: 'manana' | 'tarde' | 'noche'): void {
    this.bloque = value;
    if (value === 'manana') {
      this.horaDesde = '06:00';
      this.horaHasta = '12:00';
    } else if (value === 'tarde') {
      this.horaDesde = '12:00';
      this.horaHasta = '18:00';
    } else if (value === 'noche') {
      this.horaDesde = '18:00';
      this.horaHasta = '23:59';
    }
  }

  agregarTurno(): void {
    const fecha = (this.fechaSeleccionada || '').trim();
    if (!fecha) return;

    const notasLimpias = (this.notas || '').trim();

    const payload = {
      fecha,
      bloque: this.bloque,
      notas: notasLimpias || 'Ventas',
      horaDesde: this.horaDesde || undefined,
      horaHasta: this.horaHasta || undefined,
    };

    this.http.post<TurnoDiaItem>(this.apiUrl, payload).subscribe({
      next: () => {
        this.notas = '';
        this.horaDesde = '';
        this.horaHasta = '';
        this.cargarDesdeBackend();
        try {
          Swal.fire({
            icon: 'success',
            title: 'Turno Registrado',
            html: 'El <b>Turno</b> se Registró Correctamente.',
            timer: 1800,
            showConfirmButton: false,
          });
        } catch {}
      },
      error: () => {
        try {
          Swal.fire({
            icon: 'error',
            title: 'No se pudo Registrar el Turno',
            text: 'Intenta Nuevamente más Tarde.',
          });
        } catch {}
      }
    });
  }

  eliminarTurno(id: number): void {
    if (!id) return;
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.cargarDesdeBackend();
        try {
          Swal.fire({
            icon: 'success',
            title: 'Turno Eliminado',
            html: 'El <b>Turno</b> se Eliminó Correctamente.',
            timer: 1600,
            showConfirmButton: false,
          });
        } catch {}
      },
      error: () => {
        try {
          Swal.fire({
            icon: 'error',
            title: 'No se pudo Eliminar el Turno',
            text: 'Intenta Nuevamente más Tarde.',
          });
        } catch {}
      }
    });
  }

  /**
   * Devuelve el estado "calculado" en base a la fecha/hora actual.
   * Si el turno ya pasó y no está cumplido, lo consideramos incumplido.
   */
  getEstadoCalculado(t: TurnoDiaItem): TurnoDiaItem['estado'] {
    const estadoBase = t.estado;
    if (!estadoBase) {
      return undefined;
    }

    // Si ya está marcado como cumplido o incumplido, respetamos ese estado
    if (estadoBase === 'cumplido' || estadoBase === 'incumplido') {
      return estadoBase;
    }

    // Construimos la fecha/hora final del turno
    const fecha = (t.fecha || '').trim();
    if (!fecha) {
      return estadoBase;
    }

    const [year, month, day] = fecha.split('-').map(Number);
    if (!year || !month || !day) {
      return estadoBase;
    }

    // Usamos horaHasta si existe, si no, asumimos fin de día 23:59
    let hora = 23;
    let minuto = 59;
    if (t.horaHasta) {
      const parts = t.horaHasta.split(':').map(Number);
      if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
        hora = parts[0];
        minuto = parts[1];
      }
    }

    const finTurno = new Date(year, month - 1, day, hora, minuto, 0, 0);
    const ahora = new Date();

    // Normalizamos solo la fecha (sin hora) para comparar días
    const hoySoloFecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const fechaTurnoSoloFecha = new Date(year, month - 1, day);

    // Si ya pasó la fecha/hora final y no está cumplido, lo mostramos como incumplido
    if (ahora.getTime() > finTurno.getTime()) {
      return 'incumplido';
    }

    // Si la fecha del turno es futura y no está cumplido/incumplido, lo mostramos como "por_cumplir"
    if (fechaTurnoSoloFecha.getTime() > hoySoloFecha.getTime()) {
      return 'por_cumplir';
    }

    // Si la fecha del turno es hoy y venía como "por_cumplir", lo mostramos como "pendiente"
    if (fechaTurnoSoloFecha.getTime() === hoySoloFecha.getTime() && estadoBase === 'por_cumplir') {
      return 'pendiente';
    }

    // En cualquier otro caso, mostramos el estado que viene del backend
    return estadoBase;
  }

  /**
   * Devuelve una observación para mostrar según el estado calculado del turno.
   * Si ya viene observacionEstado desde el backend, se respeta.
   */
  getObservacionCalculada(t: TurnoDiaItem): string | undefined {
    const estCalculado = this.getEstadoCalculado(t);
    const obsBase = (t.observacionEstado || '').trim();

    // Si viene observación desde backend y el estado base coincide con el calculado, la respetamos
    if (obsBase && t.estado && t.estado === estCalculado) {
      return obsBase;
    }

    switch (estCalculado) {
      case 'incumplido':
        return 'El Turno fue Incumplido.';
      case 'cumplido':
        return 'El Turno fue Cumplido.';
      case 'pendiente':
        return 'El Turno está Pendiente.';
      case 'por_cumplir':
        return 'Turno programado para una fecha futura.';
      default:
        return undefined;
    }
  }

  turnosDeFechaActual(): TurnoDiaItem[] {
    const f = (this.fechaConsulta || this.fechaSeleccionada || '').trim();
    return this.turnos.filter(t => t.fecha === f);
  }
}
