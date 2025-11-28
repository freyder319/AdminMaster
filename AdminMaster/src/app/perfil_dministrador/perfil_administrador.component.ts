import { Component } from '@angular/core';
import { AdminNavbarComponent } from '../admin_navbar/admin_navbar.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionNegocio, ConfiguracionService } from '../services/configuracion.service';
import Swal from 'sweetalert2';
import { AgenteIAComponent } from "../agente-ia/agente-ia.component";

@Component({
  selector: 'app-perfil-administrador',
  imports: [AdminNavbarComponent, RouterModule, CommonModule, FormsModule, AgenteIAComponent],
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
  private pendingLogoBase64: string | null = null;

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
            logoUrl: cfg.logoUrl ?? '',
            logoFile: null
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

  onLogoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string | null;
      if (result) {
        // Mostrar vista previa inmediatamente con la imagen seleccionada (solo local)
        this.form.logoUrl = result;
        // Marcar que hay un logo pendiente de procesar/guardar cuando se envíe el formulario
        this.pendingLogoBase64 = result;
      }
    };
    reader.readAsDataURL(file);
  }

  onSubmit() {
    if (this.loading) return;
    this.loading = true;

    // Si hay un logo nuevo pendiente, primero procesarlo en el backend (quitar fondo)
    if (this.pendingLogoBase64) {
      const base64 = this.pendingLogoBase64;
      this.cfgSvc.uploadLogo({ imageBase64: base64 }).subscribe({
        next: (cfg) => {
          // Actualizar logoUrl con el resultado procesado
          this.form.logoUrl = cfg.logoUrl ?? this.form.logoUrl;
          this.config = cfg;
          this.pendingLogoBase64 = null;
          // Luego guardar el resto de campos normalmente
          this.saveConfig();
        },
        error: (err) => {
          console.error('Error procesando logo antes de guardar:', err);
          // Si falla el procesamiento, mantener la imagen seleccionada y guardar igualmente
          this.pendingLogoBase64 = null;
          this.saveConfig();
        }
      });
    } else {
      // No hay cambio de logo pendiente, solo guardar configuración
      this.saveConfig();
    }
  }

  private saveConfig() {
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
            title: 'Perfil Actualizado',
            html: 'El <b>Perfil</b> se Actualizo Correctamente',
            timer: 1800,
            showConfirmButton: false,
          }).then(() => {
            // Recargar la página para reflejar logo y datos en toda la app
            window.location.reload();
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
          }).then(() => {
            // Recargar la página para reflejar logo y datos en toda la app
            window.location.reload();
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
