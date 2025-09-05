import { Component } from '@angular/core';
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { FooterComponent } from "../footer/footer.component";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-donde-estamos',
  imports: [NavBarComponent, FooterComponent,RouterModule],
  templateUrl: './donde_estamos.component.html',
  styleUrl: './donde_estamos.component.scss'
})
export class DondeEstamosComponent {
    
}
