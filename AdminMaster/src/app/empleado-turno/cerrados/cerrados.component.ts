import { Component, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TurnosService, TurnoActivoItem } from '../../services/turnos.service';
import { catchError } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

@Component({
  selector: 'app-turnos-cerrados',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './cerrados.component.html',
  styleUrls: ['./cerrados.component.scss']
})
export class CerradosComponent implements OnDestroy {
  cerrados: TurnoActivoItem[] = [];
  cargando = false;
  private sub?: Subscription;
  modalAbierto = false;
  seleccionado: TurnoActivoItem | null = null;

  constructor(private turnos: TurnosService) {
    this.cargar();
  }

  ngOnDestroy(): void {
    try { this.sub?.unsubscribe(); } catch {}
  }

  private cargar() {
    this.cargando = true;
    this.sub = this.turnos.getTurnosCerradosPublic()
      .pipe(catchError(() => of([] as TurnoActivoItem[])))
      .subscribe((items) => {
        this.cerrados = items || [];
        this.cargando = false;
      });
  }

  abrirDetalle(item: TurnoActivoItem) {
    this.seleccionado = item;
    this.modalAbierto = true;
  }

  cerrarDetalle() {
    this.modalAbierto = false;
    this.seleccionado = null;
  }
}
