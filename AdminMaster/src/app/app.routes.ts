import { Routes } from '@angular/router';
import { AdministradorPrincipalComponent } from './admin_principal/admin_principal.component';
import { VentaProductoComponent } from './venta_producto/venta_producto.component';
import { InventoryComponent } from './inventory/inventory.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { CajasComponent } from './cajas/cajas.component';
import { ProveedoresComponent } from './proveedores/proveedores.component';
import { ClientesComponent } from './clientes/clientes.component';
import { LoginPuntoVentaComponent } from './auth/login_punto_venta/login_punto_venta.component';
import { LoginAdminComponent } from './auth/login_admin/login_admin.component';
import { DondeEstamosComponent } from './donde_estamos/donde_estamos.component';
import { PqrsComponent } from './pqrs/pqrs.component';
import { PerfilAdministradorComponent } from './perfil_dministrador/perfil_administrador.component';
import { ProductsComponent } from './products(principal)/products.component';
import { ModifyProveedorComponent } from './modify-proveedor/modify-proveedor.component';
import { SecurityTelefComponent } from './security_telef/security_telef.component';
import { SecurityEmailComponent } from './security_email/security_email.component';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
    // Rutas para administrador
    { path: "admin", component: AdministradorPrincipalComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
    { path: "movimientos", component: AdministradorPrincipalComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] } },
    { path: "perfil_administrador", component: PerfilAdministradorComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
    { path: "crear_venta", component: VentaProductoComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] } },
    { path: "inventario", component: InventoryComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] } },
    { path: "estadisticas", component: EstadisticasComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
    { path: "cajas", component: CajasComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
    { path: "proveedor", component: ProveedoresComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
    { path: "modificar-proveedor", component: ModifyProveedorComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
    { path: "clientes", component: ClientesComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] } },
    
    // Rutas para cliente
    { path: "login-admin", component: LoginAdminComponent },
    { path: "login-puntopos", component: LoginPuntoVentaComponent },
    { path: "recuperar-telefono", component: SecurityTelefComponent },
    { path: "recuperar-email", component: SecurityEmailComponent },
    { path: "donde-estamos", component: DondeEstamosComponent },
    { path: "pqrs", component: PqrsComponent },
    { path: "", component: ProductsComponent},

];