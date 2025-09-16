import { Component } from '@angular/core';
import { AdminNavbarComponent } from '../admin_navbar/admin_navbar.component';
import { RouterModule } from '@angular/router';
import { FilterComponent } from '../filter/filter.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InfoDialogComponent } from '../info-dialog/info-dialog.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-administrador-principal',
  standalone: true,
  imports: [
    AdminNavbarComponent,
    RouterModule,
    FilterComponent,
    MatDialogModule,
    InfoDialogComponent,
    CommonModule,
    MatButtonModule,
  ],
  templateUrl: './admin_principal.component.html',
  styleUrl: './admin_principal.component.scss'
})
export class AdministradorPrincipalComponent {

  constructor(private dialog: MatDialog, public route: ActivatedRoute) {}

  abrirDialogo(detalle: {
    producto: string;
    valor: string;
    pago: string;
    fecha: string;
    estado: string;
  }) {
    if (window.innerWidth < 768) {
      this.dialog.open(InfoDialogComponent, {
        data: detalle,
        width: '90vw',
        maxHeight: '80vh'
      });
    }
  }

}

