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
import { AdminNavbarComponent } from './admin-navbar/admin-navbar.component';
import { InventoryComponent } from './inventory/inventory.component';
import { ProveedoresComponent } from './proveedores/proveedores.component';
import { ClientesComponent } from './clientes/clientes.component';
import { CajasComponent } from './cajas/cajas.component';
import { CreateGastoComponent } from './create-gasto/create-gasto.component';
import { CreateVentaComponent } from './create-venta/create-venta.component';
import { CreateProductoComponent } from './create-producto/create-producto.component';
import { FilterComponent } from './filter/filter.component';
import { VentaProductoComponent } from './venta-producto/venta-producto.component';
export const routes: Routes = [
    // Administrador
    {path:"", component:AdministradorPrincipalComponent},//localhost:4200/
    // Cliente
    {path:"login-admin", component: LoginAdminComponent},// localhost:4200/login
    {path:"donde-estamos", component: DondeEstamosComponent},// localhost:4200/donde estamos
    {path:"pqrs", component: PqrsComponent},// localhost:4200/pqrs
];