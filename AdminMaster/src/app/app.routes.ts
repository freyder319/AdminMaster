import { Routes } from '@angular/router';
import { AdministradorPrincipalComponent } from './admin-principal/admin-principal.component';
import { VentaProductoComponent } from './venta_producto/venta_producto.component';
import { InventoryComponent } from './inventory/inventory.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { CajasComponent } from './cajas/cajas.component';
import { ProveedoresComponent } from './proveedores/proveedores.component';
import { ClientesComponent } from './clientes/clientes.component';
import { LoginPuntoVentaComponent } from './login-punto-venta/login-punto-venta.component';
import { LoginAdminComponent } from './login-admin/login-admin.component';
import { DondeEstamosComponent } from './donde-estamos/donde-estamos.component';
import { PqrsComponent } from './pqrs/pqrs.component';

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
