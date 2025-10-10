import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from "./nav-bar/nav-bar.component";
import { ProductsComponent } from "./products(principal)/products.component";
import { FooterComponent } from "./footer/footer.component";
import { PqrsComponent } from "./pqrs/pqrs.component";
import { DondeEstamosComponent } from "./donde_estamos/donde_estamos.component";
import { SecurityEmailComponent } from './security_email/security_email.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent, FooterComponent, PqrsComponent, DondeEstamosComponent, ProductsComponent, SecurityEmailComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'AdminMaster';
}

