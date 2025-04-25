import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar.component';
import { InventoryComponent } from '../inventory/inventory.component';

@Component({
  selector: 'app-estadisticas',
  imports: [RouterModule, AdminNavbarComponent],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.scss'
})
export class EstadisticasComponent {

}
