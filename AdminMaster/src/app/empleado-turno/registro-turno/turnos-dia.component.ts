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
    const fecha = (this.fechaSeleccionada || '').trim();
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

  turnosDeFechaActual(): TurnoDiaItem[] {
    const f = (this.fechaSeleccionada || '').trim();
    return this.turnos.filter(t => t.fecha === f);
  }
}
