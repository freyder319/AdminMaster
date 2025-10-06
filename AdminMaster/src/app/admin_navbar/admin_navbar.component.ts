import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-navbar',
  imports: [RouterModule],
  templateUrl: './admin_navbar.component.html',
  styleUrl: './admin_navbar.component.scss'
})

export class AdminNavbarComponent {
  constructor(private router: Router) {}

  cerrarSesion(): void {
    const rol = localStorage.getItem('rol') ?? 'usuario';

    const rolTexto = {
      admin: 'Administrador',
      punto_pos: 'Punto de Venta'
    }[rol] ?? rol;

    Swal.fire({
      title: '¿Cerrar Sesión?',
      html: `Tu Sesión como <strong>${rolTexto}</strong> se Cerrará`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Salir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then(result => {
      if (result.isConfirmed) {
        localStorage.clear();
        this.router.navigate(['/login-admin']);
        Swal.fire({
          icon: 'success',
          title: 'Sesión Cerrada',
          html: `¡Hasta Pronto, <strong>${rolTexto}</strong>!`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

}

