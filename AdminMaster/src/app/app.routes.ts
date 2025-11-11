import { Routes } from '@angular/router';
import { AdministradorPrincipalComponent } from './admin_principal/admin_principal.component';
import { VentaProductoComponent } from './venta_producto/venta_producto.component';
import { InventoryComponent } from './inventory/inventory.component';
import { EstadisticasComponent } from './estadisticas/estadisticas.component';
import { CajasComponent } from './cajas/cajas.component';
import { ProveedoresComponent } from './proveedores/proveedores.component';
import { ClientesComponent } from './clientes/clientes.component';
import { DondeEstamosComponent } from './donde_estamos/donde_estamos.component';
import { PqrsComponent } from './pqrs/pqrs.component';
import { PerfilAdministradorComponent } from './perfil_dministrador/perfil_administrador.component';
import { ProductsComponent } from './products(principal)/products.component';
import { ModifyProveedorComponent } from './modify-proveedor/modify-proveedor.component';
import { RoleGuard } from './guards/role.guard';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { SecurityEmailComponent } from './security_email/security_email.component';
import { LoginComponent } from './auth/login/login.component';
import { SendEmailComponent } from './send-email/send-email.component';
import { EmpleadosComponent } from './empleados/empleados.component';
import { EmpleadoTurnoComponent } from './empleado-turno/empleado-turno.component';
import { ActivosComponent } from './empleado-turno/activos/activos.component';
import { CerradosComponent } from './empleado-turno/cerrados/cerrados.component';
import { HistorialComponent } from './empleado-turno/historial/historial.component';
import { NotificacionesComponent } from './empleado-turno/notificaciones/notificaciones.component';
import { RecoveryEmailGuard } from './guards/recovery-email.guard';
import { RecoveryVerifiedGuard } from './guards/recovery-verified.guard';
import { InfoGastosComponent } from './info-gastos/info-gastos.component';
import { DetalleTurnoCerradoComponent } from './detalle-turno-cerrado/detalle-turno-cerrado.component';

export const routes: Routes = [
    // Rutas para administrador
    { path: "admin", component: AdministradorPrincipalComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
    { path: "movimientos", component: AdministradorPrincipalComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] } },
    { path: "perfil_administrador", component: PerfilAdministradorComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
    { path: "crear_venta", component: VentaProductoComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] } },
    { path: "inventario", component: InventoryComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] } },
    { path: "estadisticas", component: EstadisticasComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
    { path: "cajas", component: CajasComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
    { path: "empleados", component: EmpleadosComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
    { path: "proveedor", component: ProveedoresComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
    { path: "modificar-proveedor", component: ModifyProveedorComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
    { path: "clientes", component: ClientesComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] } },
    { path: "turno-empleado", component: EmpleadoTurnoComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] },children: [
        { path: "activos", component: ActivosComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] } },
        { path: "cerrados", component: CerradosComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] } },
        { path: "historial", component: HistorialComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] } },
        { path: "notificaciones", component: NotificacionesComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] } },
        { path: "", redirectTo: "activos", pathMatch: "full" }]
    },
    { path: "info-gastos/:id", component: InfoGastosComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] } },
    { path: "detalle-turno-cerrado", component: DetalleTurnoCerradoComponent, canActivate: [RoleGuard], data: { roles: ['admin', 'punto_pos'] } },
    { path: "verificar-email", component: SendEmailComponent },
    { path: "login", component: LoginComponent },
    { path: "recuperar-email", component: SecurityEmailComponent, canActivate: [RecoveryEmailGuard] },
    { path: "restablecer-contrasena", component: ResetPasswordComponent, canActivate: [RecoveryVerifiedGuard] },

    // Rutas para cliente
    { path: "donde-estamos", component: DondeEstamosComponent },
    { path: "pqrs", component: PqrsComponent },
    { path: "", component: ProductsComponent},

];