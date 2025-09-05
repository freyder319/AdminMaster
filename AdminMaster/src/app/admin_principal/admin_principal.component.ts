import { Component } from '@angular/core';
import { AdminNavbarComponent } from '../admin_navbar/admin_navbar.component';
import { RouterModule } from '@angular/router';
import { FilterComponent } from '../filter/filter.component';

@Component({
  selector: 'app-administrador-principal',
  imports: [AdminNavbarComponent, RouterModule, FilterComponent],
  templateUrl: './admin_principal.component.html',
  styleUrl: './admin_principal.component.scss'
})
export class AdministradorPrincipalComponent {
  

}
