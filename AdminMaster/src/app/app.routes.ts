import { Routes } from '@angular/router';
import { AdministradorPrincipalComponent } from './admin_principal/admin_principal.component';
import { VentaProductoComponent } from './venta_producto/venta_producto.component';
import { InventoryComponent } from './inventory/inventory.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { CajasComponent } from './cajas/cajas.component';
import { ProveedoresComponent } from './proveedores/proveedores.component';
import { ClientesComponent } from './clientes/clientes.component';
import { LoginPuntoVentaComponent } from './login_punto_venta/login_punto_venta.component';
import { LoginAdminComponent } from './login_admin/login_admin.component';
import { DondeEstamosComponent } from './donde_estamos/donde_estamos.component';
import { PqrsComponent } from './pqrs/pqrs.component';
import { PerfilAdministradorComponent } from './perfil_dministrador/perfil_administrador.component';
import { ProductsComponent } from './products(principal)/products.component';

export const routes: Routes = [
    // Rutas para administrador
    { path: "", component: AdministradorPrincipalComponent }, // localhost:4200/
    { path: "movimientos", component: AdministradorPrincipalComponent  },
    { path: "perfil_administrador", component: PerfilAdministradorComponent },
    { path: "crear_venta", component: VentaProductoComponent },
    { path: "inventario", component: InventoryComponent },
    { path: "estadisticas", component: EstadisticasComponent },
    { path: "cajas", component: CajasComponent },
    { path: "proveedor", component: ProveedoresComponent },
    { path: "clientes", component: ClientesComponent },
    { path: "puntodeventa", component: LoginPuntoVentaComponent },
    
    // Rutas para cliente
    { path: "login-admin", component: LoginAdminComponent },
    { path: "donde-estamos", component: DondeEstamosComponent },
    { path: "pqrs", component: PqrsComponent },
    {path: "productscliente", component: ProductsComponent},

];