import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterModule,Router } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterModule,CommonModule,],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent {
  scrolled = false; // bandera para el estado del navbar

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 50;
  }

  
}
