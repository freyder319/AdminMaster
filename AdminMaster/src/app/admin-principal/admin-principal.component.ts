import { Component } from '@angular/core';
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar.component';
import { CreateGastoComponent } from "../create-gasto/create-gasto.component";
import { RouterModule } from '@angular/router';
import { CreateVentaComponent } from '../create-venta/create-venta.component';
import { FilterComponent } from '../filter/filter.component';
@Component({
  selector: 'app-administrador-principal',
  imports: [AdminNavbarComponent, CreateGastoComponent, CreateGastoComponent, RouterModule, CreateVentaComponent, FilterComponent],
  templateUrl: './admin-principal.component.html',
  styleUrl: './admin-principal.component.scss'
})
export class AdministradorPrincipalComponent {

}
