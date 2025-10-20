import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { TurnosService } from '../services/turnos.service';

@Component({
  selector: 'app-admin-navbar',
  imports: [RouterModule, NgIf],
  templateUrl: './admin_navbar.component.html',
  styleUrl: './admin_navbar.component.scss'
})

export class AdminNavbarComponent {
  correo: string | null = null;
  rol: string | null = null;

  constructor(private router: Router, private turnosService: TurnosService) {}

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
      if (!result.isConfirmed) return;

      localStorage.clear();
      this.router.navigate(['/login']);
      Swal.fire({
        icon: 'success',
        title: 'Sesión Cerrada',
        html: `¡Hasta Pronto, <strong>${rolTexto}</strong>!`,
        timer: 2000,
        showConfirmButton: false
      });
    });
  }

  ngOnInit() {
    this.correo = localStorage.getItem('correo');
    this.rol = localStorage.getItem('rol');
  }

}

