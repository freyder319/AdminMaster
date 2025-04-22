import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { LoginPuntoVentaComponent } from './login-punto-venta/login-punto-venta.component';
import { LoginAdminComponent } from './login-admin/login-admin.component';
import { FooterComponent } from './footer/footer.component';
import { ProductsComponent } from './products(principal)/products.component';
import { DondeEstamosComponent } from './donde-estamos/donde-estamos.component';
import { PqrsComponent } from './pqrs/pqrs.component';
import { AdministradorPrincipalComponent } from './admin-principal/admin-principal.component';

export const routes: Routes = [
    {path:"", component:AdministradorPrincipalComponent},//localhost:4200/
    {path:"login-admin", component: LoginAdminComponent},// localhost:4200/login
    {path:"donde-estamos", component: DondeEstamosComponent},// localhost:4200/donde estamos
    {path:"pqrs", component: PqrsComponent},// localhost:4200/pqrs
];