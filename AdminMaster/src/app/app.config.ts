import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authInterceptor } from './interceptors/auth.interceptor';
import { rateLimitInterceptor } from './interceptors/rate-limit.interceptor';
import { concurrencyInterceptor } from './interceptors/concurrency.interceptor';
import { TurnoStateService } from './services/turno-state.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(), withInterceptors([concurrencyInterceptor, rateLimitInterceptor, authInterceptor])),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [TurnoStateService],
      useFactory: (state: TurnoStateService) => () => { try { state.hydrateFromStorage(); } catch {} }
    }
  ]
};

