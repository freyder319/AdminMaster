import { Component, OnInit } from '@angular/core';
import { AdminNavbarComponent } from '../admin_navbar/admin_navbar.component';
import { RouterModule } from '@angular/router';
import { FilterComponent } from '../filter/filter.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InfoDialogComponent } from '../info-dialog/info-dialog.component';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AddGastoComponent } from "../add-gasto/add-gasto.component";
import { AddVentaLibreComponent } from "../add-venta-libre/add-venta-libre.component";
import { VentaService } from '../services/venta.service';
import { VentaLibreService } from '../services/venta-libre.service';
import { GastoService, Gasto } from '../services/gasto.service';
import { EmpleadosService, Empleados } from '../services/empleados.service';
import { InfoGastosComponent } from "../info-gastos/info-gastos.component";
import { AgenteIAComponent } from '../agente-ia/agente-ia.component';
import { environment } from '../config/environment';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-administrador-principal',
  standalone: true,
  imports: [
    AdminNavbarComponent,
    RouterModule,
    FilterComponent,
    MatDialogModule,
    CommonModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    AddGastoComponent,
    AddVentaLibreComponent,
    HttpClientModule,
    FormsModule,
    AgenteIAComponent
  ],
  templateUrl: './admin_principal.component.html',
  styleUrls: ['./admin_principal.component.scss']
})
export class AdministradorPrincipalComponent implements OnInit {
  ventas: any[] = [];
  gastos: Gasto[] = [];
  selectedTab: 'ingresos' | 'egresos' | 'por_cobrar' | 'por_pagar' = 'ingresos';
  // Rango de fechas para filtrar tablas
  selectedRange: 'diario' | 'semanal' | 'mensual' | 'personalizado' = 'semanal';
  dateFrom?: Date;
  dateTo?: Date;
  // Filtro de texto (buscador)
  searchTerm: string = '';
  // Inputs UI para rango personalizado
  dateFromInput: string = '';
  dateToInput: string = '';
  // Modelos Date para Datepicker Material
  dateFromModel?: Date;
  dateToModel?: Date;
  // Mostrar indicador '(en rango)' solo cuando el usuario aplica un rango
  hasRangeApplied: boolean = false;
  // Filtros de fecha por tabla
  ingresosFrom: string = '';
  ingresosTo: string = '';
  egresosFrom: string = '';
  egresosTo: string = '';
  porCobrarFrom: string = '';
  porCobrarTo: string = '';
  porPagarFrom: string = '';
  porPagarTo: string = '';

  // Filtros avanzados (panel de filtros)
  filtroFormaPago: string = '';
  filtroClienteId: number | '' = '';
  filtroProveedorId: number | '' = '';

  constructor(
    private dialog: MatDialog,
    public route: ActivatedRoute,
    private router: Router,
    private ventaSrv: VentaService,
    private ventaLibreSrv: VentaLibreService,
    private gastoSrv: GastoService,
    private empleadosSrv: EmpleadosService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    // Cargar datos para la tabla inicial y también totales globales
    this.loadTabData();
    this.loadVentas();
    this.loadGastos();
    this.loadEmpleadosMap();
    this.loadUsuariosMap();
    // Cargar preferencias persistidas
    this.restorePreferences();
    if (!this.selectedRange) this.selectedRange = 'semanal';
    if (!this.dateFrom || !this.dateTo) this.setRange(this.selectedRange || 'semanal', false);
    // Forzar inicio en 'Sin Filtro' al entrar a la ruta
    this.clearRange();

    // Refrescar tablas cuando se registren nuevos gastos o ventas libres
    try {
      this.gastoSrv.refresh$.subscribe(() => {
        this.loadGastos();
      });
    } catch {}
    try {
      this.ventaLibreSrv.refresh$.subscribe(() => {
        this.loadVentas();
      });
    } catch {}
  }

  verGasto(g: any) {
    const id = Number(g?.id);
    if (!Number.isFinite(id)) return;
    this.router.navigate(['/info-gastos', id]);
  }

  abrirDialogoGasto(g: any) {
    const id = Number(g?.id);
    if (!Number.isFinite(id)) return;
    this.dialog.open(InfoGastosComponent, {
      data: { id },
      width: '720px',
      maxHeight: '80vh'
    });
  }

  selectTab(tab: 'ingresos' | 'egresos' | 'por_cobrar' | 'por_pagar'): void {
    this.selectedTab = tab;
    this.loadTabData();
  }

  private loadTabData(): void {
    if (this.selectedTab === 'ingresos') {
      this.loadVentas();
    } else if (this.selectedTab === 'egresos') {
      this.gastoSrv.fetchAll().subscribe({
        next: (rows) => {
          this.gastos = rows || [];
          console.log('Gastos cargados:', this.gastos.length);
        },
        error: (err) => {
          console.error('Error cargando gastos', err);
          this.gastos = [];
        }
      });
    }
  }

  // Cargas individuales para mantener totales sin depender de la pestaña activa
  private loadVentas(): void {
    this.ventaSrv.list({ limit: 100 }).subscribe({
      next: (rows) => {
        const normales = Array.isArray(rows)
          ? rows
          : (Array.isArray((rows as any)?.data) ? (rows as any).data : []);

        this.ventaLibreSrv.list().subscribe({
          next: (libres) => {
            const listaLibres = Array.isArray(libres) ? libres : [];

            const normalesNorm = (normales || []).map((v: any) => ({
              ...v,
              tipo_venta: v?.tipo_venta || 'inventario'
            }));

            const libresNorm = listaLibres.map((v: any) => ({
              id: v.id,
              total: v.total,
              forma_pago: v.forma_pago,
              transaccionId: v.transaccionId,
              fecha_hora: v.fecha_hora,
              created_at: v.created_at,
              estado: v.estado,
              resumen: v.nombre,
              descripcion: v.observaciones,
              usuario_id: v.usuario_id,
              turno_id: v.turno_id,
              tipo_venta: v.tipo_venta || 'libre',
              items: Array.isArray(v.productos)
                ? v.productos.map((p: any) => ({
                    producto: { nombreProducto: p.nombre },
                    cantidad: p.cantidad,
                    precio: p.precio,
                    subtotal: p.subtotal,
                  }))
                : [],
            }));

            this.ventas = [...normalesNorm, ...libresNorm];
            try {
              console.log('Ventas (normales + libres) cargadas:', this.ventas.length);
            } catch {}
          },
          error: (errLib) => {
            console.error('Error cargando ventas libres', errLib);
            const normalesNorm = (normales || []).map((v: any) => ({
              ...v,
              tipo_venta: v?.tipo_venta || 'inventario'
            }));
            this.ventas = normalesNorm;
          }
        });
      },
      error: (err) => {
        console.error('Error cargando ventas', err);
        this.ventas = [];
      }
    });
  }

  private loadGastos(): void {
    this.gastoSrv.fetchAll().subscribe({
      next: (rows) => {
        this.gastos = rows || [];
      },
      error: () => {
        this.gastos = [];
      }
    });
  }

  // ---------- Empleados (para mostrar nombres en tablas) ----------
  private empleadoMap: Record<number, { nombre: string; apellido: string }> = {};
  private usuarioMap: Record<number, { nombre: string; apellido: string }> = {};

  private loadEmpleadosMap(): void {
    this.empleadosSrv.getEmpleados().subscribe({
      next: (list) => {
        (list || []).forEach((e: Empleados) => {
          if (e && typeof e.id === 'number') {
            this.empleadoMap[e.id] = { nombre: e.nombre || '', apellido: e.apellido || '' } as any;
          }
        });
      },
      error: () => {
        this.empleadoMap = {};
      }
    });
  }

  private loadUsuariosMap(): void {
    // Carga admins de la tabla usuarios (si el endpoint existe)
    const url = `${environment.apiUrl}/usuario`;
    this.http.get<any[]>(url).subscribe({
      next: (list) => {
        (list || []).forEach((u: any) => {
          const id = Number(u?.id);
          if (Number.isFinite(id)) {
            const nombre = (u?.nombre || u?.nombres || '').toString();
            const apellido = (u?.apellido || u?.apellidos || '').toString();
            this.usuarioMap[id] = { nombre, apellido };
          }
        });
      },
      error: () => {
        this.usuarioMap = {};
      }
    });
  }

  empleadoNombreById(id?: number | null): string {
    const uid = Number(id);
    if (!Number.isFinite(uid) || uid <= 0) return 'Admin';
    const e = this.empleadoMap[uid];
    if (e) {
      const fullE = `${e.nombre || ''} ${e.apellido || ''}`.trim();
      if (fullE) return fullE;
    }
    const u = this.usuarioMap[uid];
    if (u) {
      const fullU = `${u.nombre || ''} ${u.apellido || ''}`.trim();
      if (fullU) return fullU || 'Admin';
    }
    return 'Admin';
  }

  // ---------- Normalizadores de IDs desde distintas respuestas ----------
  getUsuarioIdFromVenta(v: any): number | null {
    return (
      v?.usuarioId ?? v?.usuario_id ?? v?.usuario?.id ?? v?.empleadoId ?? v?.empleado_id ?? null
    );
  }

  getTurnoIdFromVenta(v: any): number | null {
    return (
      v?.turnoId ?? v?.turno_id ?? v?.turno?.id ?? null
    );
  }

  getUsuarioIdFromGasto(g: any): number | null {
    return (
      g?.usuarioId ?? g?.usuario_id ?? g?.usuario?.id ?? g?.empleadoId ?? g?.empleado_id ?? null
    );
  }

  getTurnoIdFromGasto(g: any): number | null {
    return (
      g?.turnoId ?? g?.turno_id ?? g?.turno?.id ?? null
    );
  }

  // ---------- Helpers de presentación ----------
  private buildNombre(nombre?: string, apellido?: string): string {
    const n = (nombre || '').trim();
    const a = (apellido || '').trim();
    return (n + ' ' + a).trim() || n || a || '';
  }

  displayEmpleadoVenta(v: any): string {
    // Intentar nombres anidados directamente del payload
    const nested =
      this.buildNombre(v?.usuario?.nombre, v?.usuario?.apellido) ||
      this.buildNombre(v?.empleado?.nombre, v?.empleado?.apellido) ||
      (v?.usuario_nombre || v?.empleado_nombre || v?.cajero_nombre || '').trim();
    if (nested) return nested;
    // Fallback por id
    const uid = this.getUsuarioIdFromVenta(v);
    return this.empleadoNombreById(uid || undefined);
  }

  // ---------- Cliente asociado a la venta ----------
  getClienteIdFromVenta(v: any): number | null {
    return (
      v?.clienteId ?? v?.cliente_id ?? v?.cliente?.id ?? null
    );
  }

  displayClienteVenta(v: any): string {
    const nested =
      this.buildNombre(v?.cliente?.nombre, v?.cliente?.apellido) ||
      (v?.cliente_nombre || '').toString().trim();
    if (nested) return nested;
    // Intentar extraer desde observaciones/resumen si viene texto tipo "Cliente: ..."
    const obs = (v?.observaciones || v?.resumen || '').toString();
    const marker = 'Cliente:';
    const idx = obs.indexOf(marker);
    if (idx !== -1) {
      const after = obs.substring(idx + marker.length).trim();
      if (after) return after;
    }
    const cid = this.getClienteIdFromVenta(v);
    if (cid && Number.isFinite(Number(cid))) {
      return `Cliente #${cid}`;
    }
    return 'Sin cliente';
  }

  displayEmpleadoGasto(g: any): string {
    const nested =
      this.buildNombre(g?.usuario?.nombre, g?.usuario?.apellido) ||
      this.buildNombre(g?.empleado?.nombre, g?.empleado?.apellido) ||
      (g?.usuario_nombre || g?.empleado_nombre || '').trim();
    if (nested) return nested;
    const uid = this.getUsuarioIdFromGasto(g);
    return this.empleadoNombreById(uid || undefined);
  }

  isEmpleadoVenta(v: any): boolean {
    const uid = this.getUsuarioIdFromVenta(v);
    const id = Number(uid);
    if (!Number.isFinite(id) || id <= 0) return false;
    return !!this.empleadoMap[id];
  }

  isEmpleadoGasto(g: any): boolean {
    const uid = this.getUsuarioIdFromGasto(g);
    const id = Number(uid);
    if (!Number.isFinite(id) || id <= 0) return false;
    return !!this.empleadoMap[id];
  }

  formatCop(n: number): string {
    const num = Number(n) || 0;
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);
  }

  abrirDialogo(detalle: {
    producto: string;
    valor: string;
    pago: string;
    fecha: string;
    estado: string;
  }) {
    this.dialog.open(InfoDialogComponent, {
      data: detalle,
      width: '90vw',
      maxHeight: '80vh'
    });
  }

  abrirDialogoVenta(v: any) {
    const rawItems = Array.isArray(v?.items) ? v.items : [];
    const subtotalRaw = rawItems.reduce((sum: number, i: any) => sum + (Number(i?.subtotal) || 0), 0);
    const porcentaje = Number(v?.descuentoPorcentaje) || 0;
    const descuentoMontoRaw = Math.round(subtotalRaw * (porcentaje / 100));
    const items = rawItems.map((i: any) => ({
      nombre: i?.producto?.nombreProducto ?? (`Producto #${i?.producto?.id ?? ''}`),
      cantidad: Number(i?.cantidad) || 0,
      precio: this.formatCop(Number(i?.precio) || 0),
      subtotal: this.formatCop(Number(i?.subtotal) || 0),
    }));
    const isEmpleado = this.isEmpleadoVenta(v);
    const tipoVenta = (v?.tipo_venta || '').toString().toLowerCase();
    const esVentaNormal = tipoVenta !== 'libre';

    const detalle = {
      producto: (v?.resumen || v?.descripcion || `Venta #${v?.id ?? ''}`),
      valor: this.formatCop(Number(v?.total) || 0),
      pago: (v?.forma_pago || '-'),
      fecha: (v?.fecha_hora || v?.created_at || '-'),
      estado: (v?.estado || 'Pagada'),
      descuentoNombre: (v?.descuentoNombre || null),
      descuentoPorcentaje: (v?.descuentoPorcentaje ?? null),
      descuentoMonto: porcentaje > 0 ? this.formatCop(descuentoMontoRaw) : null,
      items,
      empleadoNombre: isEmpleado && esVentaNormal ? this.displayEmpleadoVenta(v) : null,
      turnoId: isEmpleado && esVentaNormal ? (this.getTurnoIdFromVenta(v) || null) : null,
      clienteNombre: this.displayClienteVenta(v),
      transaccionId: (v as any)?.transaccionId ?? null,
    } as any;
    this.dialog.open(InfoDialogComponent, {
      data: detalle,
      width: '90vw',
      maxHeight: '80vh'
    });
  }

  // Totales
  get ventasTotales(): number {
    return (this.filteredVentas || []).reduce((sum, v: any) => sum + (Number(v?.total) || 0), 0);
  }

  get gastosTotales(): number {
    return (this.filteredGastos || []).reduce((sum, g: any) => sum + (Number(g?.monto) || 0), 0);
  }

  get balance(): number {
    return this.ventasTotales - this.gastosTotales;
  }

  // Construye un resumen con nombres de productos de la venta
  ventaResumen(v: any): string {
    const items = Array.isArray(v?.items) ? v.items : [];
    const nombres: string[] = items
      .map((i: any) => i?.producto?.nombreProducto)
      .filter((n: any) => typeof n === 'string' && n.trim().length > 0);
    if (nombres.length === 0) {
      return v?.resumen || v?.descripcion || `Venta #${v?.id ?? ''}`;
    }
    if (nombres.length === 1) return nombres[0];
    if (nombres.length === 2) return `${nombres[0]}, ${nombres[1]}`;
    // Más de 2: mostrar primeros 2 y contador de restantes
    const restantes = nombres.length - 2;
    return `${nombres[0]}, ${nombres[1]} y ${restantes} más`;
  }

  // -------------------- Filtros por rango de fechas --------------------
  setRange(type: 'diario' | 'semanal' | 'mensual' | 'personalizado', fromUI: boolean = true) {
    this.selectedRange = type;
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    if (type === 'diario') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      this.dateFrom = start; this.dateTo = end;
    } else if (type === 'semanal') {
      const start = new Date(end); start.setDate(start.getDate() - 6); start.setHours(0,0,0,0);
      this.dateFrom = start; this.dateTo = end;
    } else if (type === 'mensual') {
      const start = new Date(end); start.setDate(start.getDate() - 29); start.setHours(0,0,0,0);
      this.dateFrom = start; this.dateTo = end;
    } else {
      const desde = this.dateFromInput ? new Date(this.dateFromInput + 'T00:00:00') : undefined;
      const hasta = this.dateToInput ? new Date(this.dateToInput + 'T23:59:59') : undefined;
      this.dateFrom = desde || this.dateFrom;
      this.dateTo = hasta || this.dateTo;
    }
    this.persistPreferences();
    if (fromUI) this.hasRangeApplied = true;
  }

  get rangeLabel(): string {
    if (!this.hasRangeApplied) return 'Sin Filtro';
    switch (this.selectedRange) {
      case 'diario': return 'Diario';
      case 'semanal': return 'Semanal';
      case 'mensual': return 'Mensual';
      case 'personalizado': return 'Rango Personalizado';
    }
  }

  private formatDateInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private withinRange(dateStr: string | Date | undefined): boolean {
    if (!dateStr) return true;
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const time = d.getTime();
    const from = this.dateFrom ? this.dateFrom.getTime() : -Infinity;
    const to = this.dateTo ? this.dateTo.getTime() : Infinity;
    return time >= from && time <= to;
  }

  private withinLocalRange(dateStr: string | Date | undefined, from?: string, to?: string): boolean {
    if (!dateStr) return true;
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    let fromTime = -Infinity;
    let toTime = Infinity;
    if (from) {
      const f = new Date(from + 'T00:00:00');
      fromTime = f.getTime();
    }
    if (to) {
      const t = new Date(to + 'T23:59:59');
      toTime = t.getTime();
    }
    const time = d.getTime();
    return time >= fromTime && time <= toTime;
  }

  get filteredVentas(): any[] {
    const term = (this.searchTerm || '').toLowerCase();
    return (this.ventas || [])
      .filter(v => this.withinRange(v?.fecha_hora || v?.created_at))
      .filter(v => {
        if (!term) return true;
        const idStr = String(v?.id || '');
        const forma = (v?.forma_pago || '').toLowerCase();
        const resumen = (v?.resumen || v?.descripcion || '').toLowerCase();
        const items = Array.isArray(v?.items) ? v.items : [];
        const nombres = items.map((i: any) => (i?.producto?.nombreProducto || '')).join(' ').toLowerCase();
        return idStr.includes(term) || forma.includes(term) || resumen.includes(term) || nombres.includes(term);
      })
      .filter(v => {
        if (this.filtroFormaPago && (v?.forma_pago || '').toString().toLowerCase() !== this.filtroFormaPago.toLowerCase()) {
          return false;
        }
        if (this.filtroClienteId) {
          const cid = this.getClienteIdFromVenta(v);
          if (!cid || Number(cid) !== Number(this.filtroClienteId)) return false;
        }
        if (this.filtroProveedorId) {
          const pid = v?.proveedorId ?? v?.proveedor_id ?? v?.proveedor?.id;
          if (!pid || Number(pid) !== Number(this.filtroProveedorId)) return false;
        }
        return true;
      });
  }

  get filteredGastos(): Gasto[] {
    const term = (this.searchTerm || '').toLowerCase();
    return (this.gastos || [])
      .filter(g => this.withinRange(g?.fecha))
      .filter(g => {
        if (!term) return true;
        const nombre = (g as any)?.nombre?.toLowerCase?.() || '';
        const desc = (g?.descripcion || '').toLowerCase();
        const forma = (g?.forma_pago || '').toLowerCase();
        return nombre.includes(term) || desc.includes(term) || forma.includes(term);
      })
      .filter(g => {
        if (this.filtroFormaPago && (g?.forma_pago || '').toString().toLowerCase() !== this.filtroFormaPago.toLowerCase()) {
          return false;
        }
        if (this.filtroProveedorId) {
          const pid = (g as any)?.proveedorId ?? (g as any)?.proveedor_id ?? (g as any)?.proveedor?.id;
          if (!pid || Number(pid) !== Number(this.filtroProveedorId)) return false;
        }
        return true;
      });
  }

  // Listas para pestañas principales (excluyen pendientes)
  get ventasIngresos(): any[] {
    return this.filteredVentas
      .filter(v => (v?.estado || '').toString().toLowerCase() !== 'pendiente')
      .filter(v => this.withinLocalRange(v?.fecha_hora || v?.created_at, this.ingresosFrom, this.ingresosTo));
  }

  get gastosEgresos(): Gasto[] {
    return this.filteredGastos
      .filter(g => (g?.estado || '').toString().toLowerCase() !== 'pendiente')
      .filter(g => this.withinLocalRange(g?.fecha, this.egresosFrom, this.egresosTo));
  }

  // Listas derivadas para pestañas Por Cobrar / Por Pagar
  get ventasPorCobrar(): any[] {
    return this.filteredVentas
      .filter(v => (v?.estado || '').toString().toLowerCase() === 'pendiente')
      .filter(v => this.withinLocalRange(v?.fecha_hora || v?.created_at, this.porCobrarFrom, this.porCobrarTo));
  }

  get gastosPorPagar(): Gasto[] {
    return this.filteredGastos
      .filter(g => (g?.estado || '').toString().toLowerCase() === 'pendiente')
      .filter(g => this.withinLocalRange(g?.fecha, this.porPagarFrom, this.porPagarTo));
  }

  // Prefill current dates into inputs when opening calendar dropdown
  prefillCustomRange() {
    const now = new Date();
    const from = this.dateFrom || now;
    const to = this.dateTo || now;
    this.dateFromInput = this.formatDateInput(from);
    this.dateToInput = this.formatDateInput(to);
    this.dateFromModel = new Date(from);
    this.dateToModel = new Date(to);
  }

  applyCustomRange() {
    // Si usamos datepickers, priorizar modelos Date
    if (this.dateFromModel) this.dateFromInput = this.formatDateInput(this.dateFromModel);
    if (this.dateToModel) this.dateToInput = this.formatDateInput(this.dateToModel);
    this.setRange('personalizado', true);
  }

  get isCustomRangeInvalid(): boolean {
    if (this.dateFromModel && this.dateToModel) {
      const f = this.dateFromModel.getTime();
      const t = this.dateToModel.getTime();
      return f > t;
    }
    return false;
  }

  onSearchChange() {
    this.persistPreferences();
  }

  // Quitar rango (modo "sin filtro")
  clearRange() {
    this.dateFrom = undefined;
    this.dateTo = undefined;
    this.dateFromInput = '';
    this.dateToInput = '';
    this.dateFromModel = undefined;
    this.dateToModel = undefined;
    this.hasRangeApplied = false;
    this.persistPreferences();
  }

  private persistPreferences() {
    try {
      localStorage.setItem('adm_selectedRange', this.selectedRange);
      localStorage.setItem('adm_dateFrom', this.dateFrom ? this.dateFrom.toISOString() : '');
      localStorage.setItem('adm_dateTo', this.dateTo ? this.dateTo.toISOString() : '');
      localStorage.setItem('adm_search', this.searchTerm || '');
    } catch {}
  }

  private restorePreferences() {
    try {
      const r = localStorage.getItem('adm_selectedRange') as any;
      if (r) this.selectedRange = r;
      const df = localStorage.getItem('adm_dateFrom');
      const dt = localStorage.getItem('adm_dateTo');
      if (df) this.dateFrom = new Date(df);
      if (dt) this.dateTo = new Date(dt);
      const s = localStorage.getItem('adm_search');
      if (s !== null) this.searchTerm = s;
      // Si había un rango guardado, considerar que ya hay rango aplicado
      if (r || df || dt) this.hasRangeApplied = true;
    } catch {}
  }

  get showRangeTag(): boolean {
    return !!this.hasRangeApplied;
  }
  private async exportExcel(filename: string, sheetName: string, header: string[], rows: (string | number)[][]): Promise<void> {
    if (!rows.length) return;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(sheetName);

    ws.addRow(header);
    rows.forEach(r => ws.addRow(r));

    // Estilos de encabezado similares al backend
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } } as any;
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' } as any;
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } } as any;
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFBFD1E5' } },
        left: { style: 'thin', color: { argb: 'FFBFD1E5' } },
        bottom: { style: 'thin', color: { argb: 'FF5B9BD5' } },
        right: { style: 'thin', color: { argb: 'FFBFD1E5' } },
      } as any;
    });

    // Zebra y bordes suaves para el resto de filas
    const totalRows = ws.rowCount;
    for (let r = 2; r <= totalRows; r++) {
      const row = ws.getRow(r);
      row.alignment = { vertical: 'middle' } as any;
      const zebra = r % 2 === 0;
      row.eachCell((cell) => {
        if (zebra) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7FBFF' } } as any;
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE9EEF5' } },
          left: { style: 'thin', color: { argb: 'FFE9EEF5' } },
          bottom: { style: 'thin', color: { argb: 'FFE9EEF5' } },
          right: { style: 'thin', color: { argb: 'FFE9EEF5' } },
        } as any;
      });
    }

    // Congelar encabezado y autoajustar ancho
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.columns?.forEach((col: any) => {
      if (!col) return;
      let max = (typeof col.width === 'number' ? col.width : 10) as number;
      if (typeof col.eachCell === 'function') {
        col.eachCell({ includeEmpty: true }, (cell: any) => {
          const val = cell?.value as any;
          const text = val instanceof Date ? val.toISOString() : (val != null ? String(val) : '');
          const len = text.length;
          if (len > max) max = len;
        });
      }
      col.width = Math.min(Math.max(max + 2, 10), 44);
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async exportIngresosExcel(): Promise<void> {
    const header = ['ID', 'Nombre Productos', 'Valor', 'Medio de Pago', 'ID Transacción', 'Promoción', '% Promo', 'Fecha y Hora', 'Estado'];
    const rows = this.ventasIngresos.map(v => [
      String(v?.id ?? ''),
      this.ventaResumen(v),
      Number(v?.total) || 0,
      String(v?.forma_pago || ''),
      String((v as any)?.transaccionId || ''),
      String((v as any)?.descuentoNombre || ''),
      String((v as any)?.descuentoPorcentaje ?? ''),
      String(v?.fecha_hora || v?.created_at || ''),
      String(v?.estado || 'Pagada'),
    ] as (string | number)[]);
    await this.exportExcel('ingresos.xlsx', 'Ingresos', header, rows);
  }

  async exportEgresosExcel(): Promise<void> {
    const header = ['ID', 'Nombre', 'Descripción', 'Monto', 'Medio de Pago', 'ID Transacción', 'Fecha', 'Estado'];
    const rows = this.gastosEgresos.map(g => [
      String((g as any)?.id ?? ''),
      String((g as any)?.nombre ?? ''),
      String(g?.descripcion ?? ''),
      Number(g?.monto) || 0,
      String(g?.forma_pago || ''),
      String((g as any)?.transaccionId || ''),
      String(g?.fecha || ''),
      String(g?.estado || ''),
    ] as (string | number)[]);
    await this.exportExcel('egresos.xlsx', 'Egresos', header, rows);
  }

  async exportPorCobrarExcel(): Promise<void> {
    const header = ['ID', 'Nombre Productos', 'Valor', 'Medio de Pago', 'ID Transacción', 'Promoción', '% Promo', 'Fecha y Hora', 'Estado'];
    const rows = this.ventasPorCobrar.map(v => [
      String(v?.id ?? ''),
      this.ventaResumen(v),
      Number(v?.total) || 0,
      String(v?.forma_pago || ''),
      String((v as any)?.transaccionId || ''),
      String((v as any)?.descuentoNombre || ''),
      String((v as any)?.descuentoPorcentaje ?? ''),
      String(v?.fecha_hora || v?.created_at || ''),
      String(v?.estado || 'Pendiente'),
    ] as (string | number)[]);
    await this.exportExcel('por_cobrar.xlsx', 'Por cobrar', header, rows);
  }

  async exportPorPagarExcel(): Promise<void> {
    const header = ['ID', 'Nombre', 'Descripción', 'Monto', 'Medio de Pago', 'ID Transacción', 'Fecha', 'Estado'];
    const rows = this.gastosPorPagar.map(g => [
      String((g as any)?.id ?? ''),
      String((g as any)?.nombre ?? ''),
      String(g?.descripcion ?? ''),
      Number(g?.monto) || 0,
      String(g?.forma_pago || ''),
      String((g as any)?.transaccionId || ''),
      String(g?.fecha || ''),
      String(g?.estado || 'Pendiente'),
    ] as (string | number)[]);
    await this.exportExcel('por_pagar.xlsx', 'Por pagar', header, rows);
  }

  applyAdvancedFilters(filters: { forma_pago: string; clienteId: number | ''; proveedorId: number | ''; }): void {
    this.filtroFormaPago = filters.forma_pago || '';
    this.filtroClienteId = filters.clienteId;
    this.filtroProveedorId = filters.proveedorId;
  }

  exportCurrentTab(): void {
    if (this.selectedTab === 'ingresos') {
      this.exportIngresosExcel();
    } else if (this.selectedTab === 'egresos') {
      this.exportEgresosExcel();
    } else if (this.selectedTab === 'por_cobrar') {
      this.exportPorCobrarExcel();
    } else if (this.selectedTab === 'por_pagar') {
      this.exportPorPagarExcel();
    }
  }

}
