import { Component, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GastoService, Gasto } from '../services/gasto.service';
import { EmpleadosService } from '../services/empleados.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-info-gastos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-gastos.component.html',
  styleUrl: './info-gastos.component.scss'
})
export class InfoGastosComponent implements OnInit {
  loading = true;
  error: string | null = null;
  gasto: Gasto | null = null;
  empleadoNombre: string | null = null;
  marcando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gastoSrv: GastoService,
    private empleadosSrv: EmpleadosService,
    @Optional() private dialogRef?: MatDialogRef<InfoGastosComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) private data?: { id?: number }
  ) {}

  ngOnInit(): void {
    const idFromData = Number(this.data?.id);
    const idFromRoute = Number(this.route.snapshot.paramMap.get('id'));
    const id = Number.isFinite(idFromData) && idFromData > 0 ? idFromData : idFromRoute;
    if (!Number.isFinite(id) || id <= 0) {
      this.error = 'Identificador inválido';
      this.loading = false;
      return;
    }
    this.gastoSrv.getById(id).subscribe({
      next: (g) => {
        this.gasto = g;
        this.loading = false;
        const uid = Number(g?.usuarioId);
        if (Number.isFinite(uid) && uid > 0) {
          this.empleadosSrv.getEmpleado(uid).subscribe({
            next: (emp) => {
              const n = (emp?.nombre || '').toString().trim();
              const a = (emp?.apellido || '').toString().trim();
              const full = (n + ' ' + a).trim();
              this.empleadoNombre = full || null;
            },
            error: () => { this.empleadoNombre = null; }
          });
        }
      },
      error: () => {
        this.error = 'No se encontró el gasto';
        this.loading = false;
      }
    });
  }

  volver() {
    if (this.dialogRef) {
      this.dialogRef.close();
      return;
    }
    this.router.navigate(['/movimientos']);
  }

  marcarPagado() {
    if (!this.gasto || this.gasto.estado !== 'pendiente' || this.marcando) {
      return;
    }
    this.marcando = true;
    this.gastoSrv.update(this.gasto.id, { estado: 'confirmado' }).subscribe({
      next: (updated) => {
        this.gasto = updated;
        this.marcando = false;
      },
      error: () => {
        this.marcando = false;
      },
    });
  }
}
