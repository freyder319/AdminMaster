import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-info-dialog',
  imports: [MatDialogModule, MatButtonModule, MatCardModule, MatIconModule, MatDividerModule, CommonModule],
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.scss'],
  standalone: true
})
export class InfoDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: {
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
  }) {}
}



