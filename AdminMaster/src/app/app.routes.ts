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
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { AddCajasComponent } from './add-cajas/add-cajas.component';
export const routes: Routes = [
    // Rutas para administrador
    { path: "", component: AdministradorPrincipalComponent }, // localhost:4200/
    { path: "crear-venta", component: VentaProductoComponent },
    { path: "inventario", component: InventoryComponent },
    { path: "estadisticas", component: EstadisticasComponent },
    { path: "cajas", component: CajasComponent },
    { path: "proveedor", component: ProveedoresComponent },
    { path: "clientes", component: ClientesComponent },
    { path: "puntodeventa", component: LoginPuntoVentaComponent },

    // Rutas para cliente
    { path: "login-admin", component: LoginAdminComponent },
    { path: "donde-estamos", component: DondeEstamosComponent },
    { path: "pqrs", component: PqrsComponent }
];