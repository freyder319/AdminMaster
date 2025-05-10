import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { LoginPuntoVentaComponent } from './login_punto_venta/login_punto_venta.component';
import { LoginAdminComponent } from './login_admin/login_admin.component';
import { FooterComponent } from './footer/footer.component';
import { ProductsComponent } from './products(principal)/products.component';
import { DondeEstamosComponent } from './donde_estamos/donde_estamos.component';
import { PqrsComponent } from './pqrs/pqrs.component';
import { AdministradorPrincipalComponent } from './admin_principal/admin_principal.component';
import { AdminNavbarComponent } from './admin_navbar/admin_navbar.component';
import { InventoryComponent } from './inventory/inventory.component';
import { ProveedoresComponent } from './proveedores/proveedores.component';
import { ClientesComponent } from './clientes/clientes.component';
import { CajasComponent } from './cajas/cajas.component';
import { CreateProductoComponent } from './create_producto/create_producto.component';
import { FilterComponent } from './filter/filter.component';
import { VentaProductoComponent } from './venta_producto/venta_producto.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { AddCajasComponent } from './add_cajas/add_cajas.component';
export const routes: Routes = [
    // Administrador
    {path:"", component:AdministradorPrincipalComponent},//localhost:4200/
    {path:"crear-venta", component:VentaProductoComponent},//localhost:4200crear-venta
    {path:"inventario", component:InventoryComponent},//localhost:4200 inventario
    {path:"estadisticas", component:EstadisticasComponent},//localhost:4200 estadisticas
    {path:"cajas", component:CajasComponent},//localhost:4200 Cajas
    {path:"proveedor", component:ProveedoresComponent},//localhost:4200 proveedor
    {path:"clientes", component:ClientesComponent},//localhost:4200 cliente
    {path:"puntodeventa", component:LoginPuntoVentaComponent},//localhost:4200 cliente
    // Cliente
    {path:"login-admin", component: LoginAdminComponent},// localhost:4200/login
    {path:"donde-estamos", component: DondeEstamosComponent},// localhost:4200/donde estamos
    {path:"pqrs", component: PqrsComponent},// localhost:4200/pqrs
];