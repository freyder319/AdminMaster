import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [RouterModule,CommonModule,],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent {
  scrolled = false; // bandera para el estado del navbar
  isPqrs = false;
  isLogin = false;
  constructor(private router: Router) {
    this.isPqrs = this.router.url.includes('/pqrs');
    this.isLogin = this.router.url.includes('/login');
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        const url = e.urlAfterRedirects;
        this.isPqrs = url.includes('/pqrs');
        this.isLogin = url.includes('/login');
      });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 50;
  }

  navigateAndReload(path: string) {
    // Cierra el offcanvas si está abierto (por si Bootstrap no lo hace por atributo)
    try {
      (document.querySelector('#offcanvasMenu .btn-close') as HTMLButtonElement)?.click();
    } catch {}
    // Forzar recarga completa
    window.location.assign(path);
  }

  isActive(path: string): boolean {
    try {
      const url = this.router.url || window.location.pathname;
      if (path === '/') {
        return url === '/';
      }
      const pattern = new RegExp('^' + path.replace(/\/$/, '') + '(?:$|\/)');
      return pattern.test(url);
    } catch {
      return false;
    }
  }
}
