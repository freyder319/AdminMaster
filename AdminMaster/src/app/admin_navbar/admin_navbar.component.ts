import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { InventoryComponent } from '../inventory/inventory.component';

@Component({
  selector: 'app-admin-navbar',
  imports: [RouterModule],
  templateUrl: './admin_navbar.component.html',
  styleUrl: './admin_navbar.component.scss'
})
export class AdminNavbarComponent {

}
