import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from "./nav-bar/nav-bar.component";
import { FooterComponent } from "./footer/footer.component";
import { PqrsComponent } from "./pqrs/pqrs.component";
import {DondeEstamosComponent} from "./donde-estamos/donde-estamos.component";
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent, FooterComponent, PqrsComponent, DondeEstamosComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'AdminMaster';
}
