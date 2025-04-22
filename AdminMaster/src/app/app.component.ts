import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from "./nav-bar/nav-bar.component";
import { CarouselComponent } from "./carousel/carousel.component";
import { ProductsComponent } from "./products/products.component";
import { LoginAdminComponent } from "./login-admin/login-admin.component";
import { LoginPuntoVentaComponent } from "./login-punto-venta/login-punto-venta.component";
import { SecurityEmailComponent } from "./security-email/security-email.component";
import { SecurityTelefComponent } from './security-telef/security-telef.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent, CarouselComponent, ProductsComponent, LoginAdminComponent, LoginPuntoVentaComponent, SecurityEmailComponent, SecurityTelefComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'AdminMaster';
}
