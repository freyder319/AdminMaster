import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin-navbar/admin-navbar.component";
import { AddCajasComponent } from "../add-cajas/add-cajas.component";

@Component({
  selector: 'app-cajas',
  imports: [AdminNavbarComponent, AddCajasComponent],
  templateUrl: './cajas.component.html',
  styleUrl: './cajas.component.scss'
})
export class CajasComponent {

}
