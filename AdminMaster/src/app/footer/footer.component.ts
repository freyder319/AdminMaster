import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConfiguracionService, ConfiguracionNegocio } from '../services/configuracion.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  logoUrl: string | null = null;

  constructor(private cfgSvc: ConfiguracionService) {
    this.cfgSvc.get().subscribe({
      next: (cfg: ConfiguracionNegocio | null) => {
        this.logoUrl = cfg?.logoUrl ?? null;
      },
      error: () => {
        this.logoUrl = null;
      }
    });
  }
}
