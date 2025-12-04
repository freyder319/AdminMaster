import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { VentaService } from '../services/venta.service';
import { VentaLibreService } from '../services/venta-libre.service';


@Component({
  selector: 'app-info-dialog',
  imports: [MatDialogModule, MatButtonModule, MatCardModule, MatIconModule, MatDividerModule, CommonModule],
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.scss'],
  standalone: true
})
export class InfoDialogComponent {
  marcando = false;

  constructor(
    private dialogRef: MatDialogRef<InfoDialogComponent>,
    private ventaSrv: VentaService,
    private ventaLibreSrv: VentaLibreService,
    @Inject(MAT_DIALOG_DATA) public data: {
    id?: number;
    tipoVenta?: string;
    producto: string;
    valor: string;
    pago: string;
    fecha: string;
    estado: string;
    descuentoNombre?: string | null;
    descuentoPorcentaje?: number | null;
    descuentoMonto?: string | null;
    items?: Array<{
      nombre: string;
      cantidad: number;
      precio: string;
      subtotal: string;
    }>;
    empleadoNombre?: string | null;
    turnoId?: number | null;
    clienteNombre?: string | null;
    transaccionId?: string | null;
  }) {}

  marcarPagada() {
    if (this.marcando) { return; }
    const id = (this.data as any)?.id;
    const tipo = (this.data as any)?.tipoVenta || 'inventario';
    if (!id || this.data.estado !== 'pendiente') { return; }
    this.marcando = true;
    const obs = tipo === 'libre'
      ? this.ventaLibreSrv.updateEstado(id, 'confirmada')
      : this.ventaSrv.updateEstado(id, 'confirmada');
    obs.subscribe({
      next: () => {
        this.data.estado = 'confirmada';
        this.marcando = false;
      },
      error: () => {
        this.marcando = false;
      },
    });
  }
}



