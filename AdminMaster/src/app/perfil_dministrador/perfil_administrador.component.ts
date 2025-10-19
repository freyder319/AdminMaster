import { Component } from '@angular/core';
import { AdminNavbarComponent } from '../admin_navbar/admin_navbar.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionNegocio, ConfiguracionService } from '../services/configuracion.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil-administrador',
  imports: [AdminNavbarComponent, RouterModule, CommonModule, FormsModule],
  templateUrl: './perfil_administrador.component.html',
  styleUrl: './perfil_administrador.component.scss'
})
export class PerfilAdministradorComponent {
  config: ConfiguracionNegocio | null = null;
  form: ConfiguracionNegocio = {
    nombreNegocio: '',
    direccion: '',
    ciudad: '',
    celular: '',
    correo: '',
    documento: '',
    logoUrl: ''
  };

  loading = false;
  error: string | null = null;

  constructor(private cfgSvc: ConfiguracionService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.cfgSvc.get().subscribe({
      next: (cfg) => {
        this.config = cfg;
        if (cfg) {
          // Prefill form with existing config for editing
          this.form = {
            id: cfg.id,
            nombreNegocio: cfg.nombreNegocio,
            direccion: cfg.direccion,
            ciudad: cfg.ciudad,
            celular: cfg.celular,
            correo: cfg.correo,
            documento: cfg.documento,
            logoUrl: cfg.logoUrl ?? ''
          } as any;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error cargando configuración';
        console.error(err);
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.loading) return;
    this.loading = true;
    if (this.config?.id) {
      // Update existing
      const id = this.config.id;
      const { id: _, ...payload } = this.form as any;
      this.cfgSvc.update(id, payload).subscribe({
        next: (cfg) => {
          this.config = cfg;
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Perfil actualizado',
            text: 'Se realizó el cambio del perfil.',
            timer: 1800,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          this.error = 'Error guardando configuración';
          console.error(err);
          this.loading = false;
        }
      });
    } else {
      // Create new
      const { id, ...payload } = this.form as any;
      this.cfgSvc.create(payload).subscribe({
        next: (cfg) => {
          this.config = cfg;
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Perfil creado',
            text: 'Se realizó el cambio del perfil.',
            timer: 1800,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          this.error = 'Error guardando configuración';
          console.error(err);
          this.loading = false;
        }
      });
    }
  }
}
