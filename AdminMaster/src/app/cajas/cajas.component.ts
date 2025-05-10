import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { AddCajasComponent } from "../add_cajas/add_cajas.component";

@Component({
  selector: 'app-cajas',
  imports: [AdminNavbarComponent, AddCajasComponent],
  templateUrl: './cajas.component.html',
  styleUrl: './cajas.component.scss'
})
export class CajasComponent {

}
