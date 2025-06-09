import { Component } from '@angular/core';
import { AdminNavbarComponent } from '../admin_navbar/admin_navbar.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-perfil-administrador',
  imports: [AdminNavbarComponent, RouterModule],
  templateUrl: './perfil_administrador.component.html',
  styleUrl: './perfil_administrador.component.scss'
})
export class PerfilAdministradorComponent {

}
