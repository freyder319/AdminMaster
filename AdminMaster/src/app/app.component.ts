import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from "./nav-bar/nav-bar.component";
import { ProductsComponent } from "./products(principal)/products.component";
import { LoginAdminComponent } from "./login-admin/login-admin.component";
import { LoginPuntoVentaComponent } from "./login-punto-venta/login-punto-venta.component";
import { SecurityEmailComponent } from "./security-email/security-email.component";
import { SecurityTelefComponent } from './security-telef/security-telef.component';
import { FooterComponent } from "./footer/footer.component";
import { PqrsComponent } from "./pqrs/pqrs.component";
import {DondeEstamosComponent} from "./donde-estamos/donde-estamos.component";
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent, FooterComponent, PqrsComponent, DondeEstamosComponent,ProductsComponent, LoginAdminComponent, LoginPuntoVentaComponent, SecurityEmailComponent, SecurityTelefComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'AdminMaster';
}
