import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from "./nav-bar/nav-bar.component";
import { ProductsComponent } from "./products(principal)/products.component";
import { LoginAdminComponent } from "./login_admin/login_admin.component";
import { LoginPuntoVentaComponent } from "./login_punto_venta/login_punto_venta.component";
import { SecurityEmailComponent } from "./security_email/security_email.component";
import { SecurityTelefComponent } from './security_telef/security_telef.component';
import { FooterComponent } from "./footer/footer.component";
import { PqrsComponent } from "./pqrs/pqrs.component";
import { DondeEstamosComponent } from "./donde_estamos/donde_estamos.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent, FooterComponent, PqrsComponent, DondeEstamosComponent, ProductsComponent, LoginAdminComponent, LoginPuntoVentaComponent, SecurityEmailComponent, SecurityTelefComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'AdminMaster';
}

