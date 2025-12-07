import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { AdminNavbarComponent } from '../admin_navbar/admin_navbar.component';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { HttpClientModule } from '@angular/common/http';
import { EstadisticasService } from '../services/estadisticas.service';
import { AgenteIAComponent } from "../agente-ia/agente-ia.component";
@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AdminNavbarComponent, NgChartsModule, HttpClientModule, AgenteIAComponent],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class EstadisticasComponent {
  selectedOption: 'inventario' | 'comercial' | 'finanzas' = 'inventario';
  periodoSeleccionado: 'semanal' | 'mensual' | 'personalizado' = 'mensual';
  mesSeleccionado: string = '';
  semanaSeleccionada: string = '';
  highlightedIndex: number | null = null;
  
  // Filtros de fecha personalizado
  fechaDesde: string = '';
  fechaHasta: string = '';
  productosMasVendidos: any[] = [];
  barChartType: 'bar' = 'bar';
  pieChartType: 'pie' = 'pie';
  barChartValor: ChartData<'bar'> = { labels: [], datasets: [] };
  barChartValorOptions: ChartOptions<'bar'> = {};
  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  barChartDataPrecios: ChartData<'bar'> = { labels: [], datasets: [] };
  pieChartCategorias: ChartData<'pie'> = { labels: [], datasets: [] };
  pieChartValor: ChartData<'pie'> = { labels: [], datasets: [] };
  barChartRotacion: ChartData<'bar'> = { labels: [], datasets: [] };
  barChartStockCritico: ChartData<'bar'> = { labels: [], datasets: [] };
  bubbleChartRotacion: ChartData<'bubble'> = { labels: [], datasets: [] };
  bubbleChartRotacionOptions: ChartOptions<'bubble'> = {};
  lineChartVentas: ChartData<'line', number[], string> = { labels: [], datasets: [] };
  pieChartMetodosPago: ChartData<'pie'> = { labels: [], datasets: [] };
  pieChartCategoriasVenta: ChartData<'pie'> = { labels: [], datasets: [] };
  barChartVentasMes: ChartData<'bar'> = { labels: [], datasets: [] };
  barChartProductosRentables: ChartData<'bar'> = { labels: [], datasets: [] };
  lineChartVentasOptions: ChartOptions<'line'> = {};
  barChartStockCriticoOptions: ChartOptions<'bar'> = {};
  promedioRotacion: any[] = [];
  barChartDesempeno: ChartData<'bar'> = { labels: [], datasets: [] };
  barChartDesempenoOptions: ChartOptions<'bar'> = {};
  barChartDesempenoType: ChartType = 'bar';
  stockCritico: any[] = [];
  ingresosGastosData: ChartData<'bar'> = { labels: [], datasets: [] };
  ingresosGastosOptions: ChartOptions<'bar'> = {};
  margenBeneficioData: ChartData<'line'> = { labels: [], datasets: [] };
  margenBeneficioOptions: ChartOptions<'line'> = {};
  gananciasMensualesData: ChartData<'line'> = { labels: [], datasets: [] };
  gananciasMensualesOptions: ChartOptions<'line'> = {};
  distribucionGastosData: ChartData<'pie'> = { labels: [], datasets: [] };
  distribucionGastosOptions: ChartOptions<'pie'> = {};
  ticketPromedio: number = 0;
  ticketPromedioData: ChartData<'bar'> = { labels: [], datasets: [] };
  ticketPromedioOptions: ChartOptions<'bar'> = {};
  productosRentablesData: ChartData<'bar'> = { labels: [], datasets: [] };
  productosRentablesOptions: ChartOptions<'bar'> = {};
  lineIngresosGastos: ChartData<'line'> = { labels: [], datasets: [] };
  barMargenBeneficio: ChartData<'bar'> = { labels: [], datasets: [] };
  lineGananciasMensuales: ChartData<'line'> = { labels: [], datasets: [] };
  pieGastos: ChartData<'pie'> = { labels: [], datasets: [] };
  barTicketPromedio: ChartData<'bar'> = { labels: [], datasets: [] };
  barProductosGanancia: ChartData<'bar'> = { labels: [], datasets: [] };
  hayDatosInventario: boolean = true;
  hayDatosComercial: boolean = true;
  hayDatosFinanzas: boolean = true;

  get hasStockCritico(): boolean {
    return (
      this.barChartStockCritico &&
      Array.isArray(this.barChartStockCritico.labels) &&
      this.barChartStockCritico.labels.length > 0
    );
  }

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    onClick: (_event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        this.highlightedIndex = index;
        this.highlightPie(index);
      }
    }
  };
  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    onClick: (_event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        this.highlightedIndex = index;
        this.highlightBar(index);
      }
    }
  };
  constructor(private estadisticasService: EstadisticasService) {}

  ngOnInit() {
    this.cargarInventario();
  }

  cambiarPeriodo(periodo: 'semanal' | 'mensual' | 'personalizado'): void {
    if (this.periodoSeleccionado === periodo) return;
    this.periodoSeleccionado = periodo;

    // Si cambia a mensual, la semana deja de aplicar
    if (periodo === 'mensual') {
      this.semanaSeleccionada = '';
    }
    
    // Si cambia a personalizado, limpiar filtros de mes/semana
    if (periodo === 'personalizado') {
      this.mesSeleccionado = '';
      this.semanaSeleccionada = '';
    }
    
    // Si cambia desde personalizado, limpiar fechas
    if (periodo !== 'personalizado') {
      this.fechaDesde = '';
      this.fechaHasta = '';
    }

    // Recargar datos con el nuevo período
    if (this.selectedOption === 'inventario') this.cargarInventario();
    if (this.selectedOption === 'comercial') this.cargarComercial();
    if (this.selectedOption === 'finanzas') this.cargarFinanzas();
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onFechaChange(): void {
    // Validación automática: si ambas fechas están seleccionadas, aplicar filtro
    if (this.fechaDesde && this.fechaHasta) {
      // Opcional: auto-aplicar o esperar a que hagan clic en "Aplicar"
    }
  }

  aplicarFiltroFechas(): void {
    if (!this.fechaDesde || !this.fechaHasta) return;
    
    // Validar que fecha desde sea menor o igual a fecha hasta
    if (new Date(this.fechaDesde) > new Date(this.fechaHasta)) {
      alert('La fecha "Desde" debe ser anterior o igual a la fecha "Hasta"');
      return;
    }

    // Recargar datos con el rango de fechas personalizado
    if (this.selectedOption === 'inventario') this.cargarInventario();
    if (this.selectedOption === 'comercial') this.cargarComercial();
    if (this.selectedOption === 'finanzas') this.cargarFinanzas();
  }

  openDatePicker(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.type === 'date') {
      // Remover readonly temporalmente para permitir la interacción
      input.removeAttribute('readonly');
      // Hacer foco y mostrar el picker
      input.focus();
      input.showPicker?.();
      // Restaurar readonly después de un pequeño delay
      setTimeout(() => {
        input.setAttribute('readonly', 'true');
      }, 100);
    }
  }

  onMesChange(valor: string): void {
    this.mesSeleccionado = valor;
    if (this.selectedOption === 'inventario') this.cargarInventario();
    if (this.selectedOption === 'comercial') this.cargarComercial();
    if (this.selectedOption === 'finanzas') this.cargarFinanzas();
  }

  onSemanaChange(valor: string): void {
    this.semanaSeleccionada = valor;
    if (this.selectedOption === 'inventario') this.cargarInventario();
    if (this.selectedOption === 'comercial') this.cargarComercial();
    if (this.selectedOption === 'finanzas') this.cargarFinanzas();
  }

  selectOption(option: 'inventario' | 'comercial' | 'finanzas'): void {
    this.selectedOption = option;

    if (option === 'inventario') this.cargarInventario();
    if (option === 'comercial') this.cargarComercial();
    if (option === 'finanzas') this.cargarFinanzas();
  }

  // 🔹 Ejemplo: datos reales desde tu API
  cargarInventario() {
    this.estadisticasService
      .getInventario(this.periodoSeleccionado, this.mesSeleccionado, this.semanaSeleccionada, this.fechaDesde, this.fechaHasta)
      .subscribe((data) => {
    if (!data || !data.labels || data.labels.length === 0) {
      this.hayDatosInventario = false;
      this.pieChartCategorias = { labels: [], datasets: [] };
      this.barChartDataPrecios = { labels: [], datasets: [] };
      this.barChartValor = { labels: [], datasets: [] };
      this.barChartRotacion = { labels: [], datasets: [] };
      this.barChartStockCritico = { labels: [], datasets: [] };
      this.bubbleChartRotacion = { labels: [], datasets: [] };
      return;
    }

    // Si backend no envía vendidos, crear array de ceros (evita errores)
    if (!data.vendidos) {
      data.vendidos = data.stock.map(() => 0);
    }

    // Si todo el stock y vendidos son 0, consideramos que no hay datos reales
    const tieneStockPositivo = Array.isArray(data.stock) && data.stock.some((n: number) => Number(n) > 0);
    const tieneVendidosPositivos = Array.isArray(data.vendidos) && data.vendidos.some((n: number) => Number(n) > 0);

    if (!tieneStockPositivo && !tieneVendidosPositivos) {
      this.hayDatosInventario = false;
      this.pieChartCategorias = { labels: [], datasets: [] };
      this.barChartDataPrecios = { labels: [], datasets: [] };
      this.barChartValor = { labels: [], datasets: [] };
      this.barChartRotacion = { labels: [], datasets: [] };
      this.barChartStockCritico = { labels: [], datasets: [] };
      this.bubbleChartRotacion = { labels: [], datasets: [] };
      return;
    }

    this.hayDatosInventario = true;

    // A) Distribución por categoría (Pie)
    const categoriasMap: any = {};
    data.categorias.forEach((cat: string, i: number) => {
      categoriasMap[cat] = (categoriasMap[cat] || 0) + data.stock[i];
    });

    this.pieChartCategorias = {
      labels: Object.keys(categoriasMap),
      datasets: [
        {
          data: Object.values(categoriasMap),
          backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0']
        }
      ]
    };

    // B) Productos con mayor precio comercial (Bar top 5)
    const productosOrdenados = data.labels
      .map((nombre: string, i: number) => ({
        nombre,
        precio: Number(data.precioComercial[i])
      }))
      .sort((a: any, b: any) => b.precio - a.precio)
      .slice(0, 5);

    this.barChartDataPrecios = {
      labels: productosOrdenados.map((p: any) => p.nombre),
      datasets: [
        {
          label: 'Precio Comercial',
          data: productosOrdenados.map((p: any) => p.precio),
          backgroundColor: '#ff9800'
        }
      ]
    };

    // C) Valor económico del inventario por producto (TOP 5)
    const valorInventario = data.stock.map((cantidad: number, i: number) =>
      cantidad * Number(data.precioComercial[i])
    );
    const productosValor = data.labels
      .map((nombre: string, i: number) => ({ nombre, valor: valorInventario[i] }))
      .sort((a: any, b: any) => b.valor - a.valor)
      .slice(0, 5);

    this.barChartValor = {
      labels: productosValor.map((p: any) => p.nombre),
      datasets: [
        {
          label: 'Valor de Inventario (COP)',
          data: productosValor.map((p: any) => p.valor),
          backgroundColor: '#4caf50'
        }
      ]
    };
    this.barChartValorOptions = { responsive: true, indexAxis: 'y' };

    // === Aquí creamos stockCritico correctamente ===
    const stockCritico = data.labels
      .map((nombre: string, i: number) => ({ nombre, stock: Number(data.stock[i]) }))
      .filter((p: any) => p.stock < 10); // umbral 10 (ajustable)

    // Guardamos en la propiedad del componente (opcional)
    this.stockCritico = stockCritico;

    // Crear array dinámico de colores según nivel de riesgo
    const coloresStock = stockCritico.map((p: any) => {
      if (p.stock <= 5) return '#f44336';    // rojo
      if (p.stock <= 10) return '#ff9800';   // amarillo
      return '#4caf50';                      // verde
    });

    // Asignar datos a la gráfica de stock crítico
    this.barChartStockCritico = {
      labels: stockCritico.map((p: any) => p.nombre),
      datasets: [
        {
          label: 'Stock disponible',
          data: stockCritico.map((p: any) => p.stock),
          backgroundColor: coloresStock
        }
      ]
    };
    this.barChartStockCriticoOptions = { responsive: true, indexAxis: 'y' };

    // Productos con menor rotación (TOP 5 menos vendidos)
    const bajaRotacion = data.labels
      .map((nombre: string, i: number) => ({ nombre, vendidos: data.vendidos[i] || 0 }))
      .sort((a: any, b: any) => a.vendidos - b.vendidos)
      .slice(0, 5);

    this.barChartRotacion = {
      labels: bajaRotacion.map((p: any) => p.nombre),
      datasets: [
        {
          label: 'Unidades Vendidas',
          data: bajaRotacion.map((p: any) => p.vendidos),
          backgroundColor: '#f44336'
        }
      ]
    };

    // Promedio de rotacion (top 5 mejor rotación)
    const rotacion = data.labels.map((nombre: string, i: number) => ({
      nombre,
      ratio: data.vendidos[i] > 0 ? (data.stock[i] / data.vendidos[i]) : Infinity
    }));
    this.promedioRotacion = rotacion.sort((a: any, b: any) => a.ratio - b.ratio).slice(0, 5);

    // Promedio de rotación usando gráfico de burbuja
    const bubbleData = rotacion.map((p: any, i: number) => ({
      x: i + 1,
      y: p.ratio,
      r: p.ratio < 1 ? 12 : p.ratio < 3 ? 8 : 5 // el tamaño cambia según rendimiento
    }));

    this.bubbleChartRotacion = {
      labels: rotacion.map((p: any) => p.nombre),
      datasets: [
        {
          label: 'Promedio de Rotación (Stock/Ventas)',
          data: bubbleData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };

    this.bubbleChartRotacionOptions = {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Productos' } },
        y: { title: { display: true, text: 'Ratio de Rotación' } }
      }
    };

  });
  }


  cargarComercial() {
    // ✅ 1) Cargar productos más vendidos
    this.estadisticasService
      .getProductosMasVendidos(
        this.periodoSeleccionado,
        this.mesSeleccionado,
        this.semanaSeleccionada,
        this.fechaDesde || undefined,
        this.fechaHasta || undefined
      )
      .subscribe((data) => {
      this.productosMasVendidos = data;

      if (!data || data.length === 0 || !data.some((p: any) => Number(p.vendidos) > 0)) {
        this.hayDatosComercial = false;
        this.barChartData = { labels: [], datasets: [] };
        this.lineChartVentas = { labels: [], datasets: [] };
        this.pieChartMetodosPago = { labels: [], datasets: [] };
        this.pieChartCategoriasVenta = { labels: [], datasets: [] };
        this.barChartVentasMes = { labels: [], datasets: [] };
        this.barChartProductosRentables = { labels: [], datasets: [] };
        return;
      }

      this.hayDatosComercial = true;

      this.barChartData = {
        labels: data.map(p => p.nombre),
        datasets: [
          {
            label: 'Unidades vendidas',
            data: data.map(p => p.vendidos),
            backgroundColor: ['#4e73df', '#36b9cc', '#1cc88a', '#f6c23e', '#e74a3b']
          }
        ]
      };
    });

    //  2) Cargar ventas mensuales → gráfica de línea
    this.estadisticasService
      .getComercial(
        this.periodoSeleccionado,
        this.mesSeleccionado,
        this.semanaSeleccionada,
        this.fechaDesde || undefined,
        this.fechaHasta || undefined
      )
      .subscribe((data) => {

    if (!data || !data.labels || data.labels.length === 0 || !data.data || data.data.every((v: number) => Number(v) === 0)) {
      this.hayDatosComercial = false;
      this.lineChartVentas = { labels: [], datasets: [] };
      return;
    }

    this.lineChartVentas = {
      labels: data.labels,
      datasets: [
        {
          label: 'Monto vendido (COP)',
          data: data.data,
          borderColor: '#4e73df',
          backgroundColor: 'rgba(78, 115, 223, 0.2)',
          borderWidth: 3,
          tension: 0.3,
          fill: true
        }
      ]
    };
    this.estadisticasService
      .getVentasPorMetodoPago(
        this.periodoSeleccionado,
        this.mesSeleccionado,
        this.semanaSeleccionada,
        this.fechaDesde || undefined,
        this.fechaHasta || undefined
      )
      .subscribe((data: any) => {
    this.pieChartMetodosPago = {
      labels: data.labels,
      datasets: [
        {
          data: data.values,
          backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e','#e74a3b'],
        }
      ]
    };
  });

  // ✅ Ventas por categoría
  this.estadisticasService
    .getVentasPorCategoria(
      this.periodoSeleccionado,
      this.mesSeleccionado,
      this.semanaSeleccionada,
      this.fechaDesde || undefined,
      this.fechaHasta || undefined
    )
    .subscribe((data: any) => {
    this.pieChartCategoriasVenta = {
      labels: data.labels,
      datasets: [
        {
          data: data.values,
          backgroundColor: ['#9c27b0','#03a9f4','#ff9800','#4caf50','#f44336']
        }
      ]
    };
  });

  // ✅ Ventas por mes (Cantidad, no dinero)
  this.estadisticasService
    .getVentasPorMes(
      this.periodoSeleccionado,
      this.mesSeleccionado,
      this.semanaSeleccionada,
      this.fechaDesde || undefined,
      this.fechaHasta || undefined
    )
    .subscribe((data: any) => {
    this.barChartVentasMes = {
      labels: data.labels,
      datasets: [
        {
          label: 'Ventas realizadas',
          data: data.values,
          backgroundColor: '#36b9cc'
        }
      ]
    };
  });

  // ✅ Productos más rentables (ganancia = precioComercial - precioUnitario)
  this.estadisticasService
    .getProductosRentables(
      this.periodoSeleccionado,
      this.mesSeleccionado,
      this.semanaSeleccionada,
      this.fechaDesde || undefined,
      this.fechaHasta || undefined
    )
    .subscribe((data: any) => {
    this.barChartProductosRentables = {
      labels: data.labels,
      datasets: [
        {
          label: 'Ganancia (COP)',
          data: data.values,
          backgroundColor: '#1cc88a'
        }
      ]
    };
  });

    this.lineChartVentasOptions = {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          min: 0
        }
      }
    };
    });
  }

  cargarFinanzas() {
    this.estadisticasService
      .getFinanzas(
        this.periodoSeleccionado,
        this.mesSeleccionado,
        this.semanaSeleccionada,
        this.fechaDesde || undefined,
        this.fechaHasta || undefined
      )
      .subscribe({
      next: (data: any) => {

        if (!data) {
          console.error(" No llegaron datos de finanzas");
          this.hayDatosFinanzas = false;
          this.lineIngresosGastos = { labels: [], datasets: [] };
          this.barMargenBeneficio = { labels: [], datasets: [] };
          this.lineGananciasMensuales = { labels: [], datasets: [] };
          this.pieGastos = { labels: [], datasets: [] };
          this.barTicketPromedio = { labels: [], datasets: [] };
          this.barProductosGanancia = { labels: [], datasets: [] };
          return;
        }

        const sinIngresos = !data.ingresosGastos || !data.ingresosGastos.ingresos || data.ingresosGastos.ingresos.every((v: number) => Number(v) === 0);
        const sinGastos = !data.ingresosGastos || !data.ingresosGastos.gastos || data.ingresosGastos.gastos.every((v: number) => Number(v) === 0);
        const sinGanancias = !data.gananciasMensuales || !data.gananciasMensuales.values || data.gananciasMensuales.values.every((v: number) => Number(v) === 0);

        if (sinIngresos && sinGastos && sinGanancias) {
          this.hayDatosFinanzas = false;
          this.lineIngresosGastos = { labels: [], datasets: [] };
          this.barMargenBeneficio = { labels: [], datasets: [] };
          this.lineGananciasMensuales = { labels: [], datasets: [] };
          this.pieGastos = { labels: [], datasets: [] };
          this.barTicketPromedio = { labels: [], datasets: [] };
          this.barProductosGanancia = { labels: [], datasets: [] };
          return;
        }

        this.hayDatosFinanzas = true;

        // Ingresos vs Gastos
        if (data.ingresosGastos) {
          this.lineIngresosGastos = {
            labels: data.ingresosGastos.labels,
            datasets: [
              {
                label: 'Ingresos (COP)',
                data: data.ingresosGastos.ingresos,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                pointBackgroundColor: '#2E7D32', // Verde oscuro para los puntos
                pointBorderColor: '#1B5E20', // Borde del punto un poco más oscuro
                pointHoverBackgroundColor: '#1B5E20',
                pointHoverBorderColor: '#003300',
                pointBorderWidth: 1,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2,
                tension: 0.3,
                fill: true
              },
              {
                label: 'Gastos (COP)',
                data: data.ingresosGastos.gastos,
                borderColor: '#F44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                pointBackgroundColor: '#C62828', // Rojo oscuro para los puntos
                pointBorderColor: '#B71C1C', // Borde del punto un poco más oscuro
                pointHoverBackgroundColor: '#B71C1C',
                pointHoverBorderColor: '#7F0000',
                pointBorderWidth: 1,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2,
                tension: 0.3,
                fill: true
              }
            ]
          };
        }

      // 2. Margen de beneficio
      if (data.margenBeneficio) {
        this.barMargenBeneficio = {
          labels: data.margenBeneficio.labels,
          datasets: [{
            label: 'Margen %', 
            data: data.margenBeneficio.values,
            backgroundColor: data.margenBeneficio.values.map((value: number) => 
              value >= 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)'
            ),
            borderColor: data.margenBeneficio.values.map((value: number) => 
              value >= 0 ? '#4CAF50' : '#F44336'
            ),
            borderWidth: 1
          }]
        };
      }

      // 3. Ganancias Mensuales
      if (data.gananciasMensuales) {
        this.lineGananciasMensuales = {
          labels: data.gananciasMensuales.labels,
          datasets: [{
            label: 'Ganancia (COP)', 
            data: data.gananciasMensuales.values,
            borderColor: data.gananciasMensuales.values.map((value: number) => 
              value >= 0 ? '#4CAF50' : '#F44336'
            ),
            pointBackgroundColor: data.gananciasMensuales.values.map((value: number) => 
              value >= 0 ? '#2E7D32' : '#C62828'
            ),
            pointBorderColor: data.gananciasMensuales.values.map((value: number) => 
              value >= 0 ? '#1B5E20' : '#B71C1C'
            ),
            pointHoverBackgroundColor: data.gananciasMensuales.values.map((value: number) => 
              value >= 0 ? '#1B5E20' : '#B71C1C'
            ),
            pointHoverBorderColor: data.gananciasMensuales.values.map((value: number) => 
              value >= 0 ? '#003300' : '#7F0000'
            ),
            pointBorderWidth: 1,
            pointRadius: 4,
            pointHoverRadius: 6,
            backgroundColor: (context: any) => {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              
              const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              gradient.addColorStop(0, 'rgba(76, 175, 80, 0.05)');
              gradient.addColorStop(1, 'rgba(76, 175, 80, 0.3)');
              return gradient;
            },
            borderWidth: 2,
            tension: 0.3,
            fill: true
          }]
        };
      }

      // 4. Distribución de gastos
      if (data.distribucionGastos) {
        // Colores para la distribución de gastos
        const expenseColors = [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40', '#8AC24A', '#607D8B',
          '#E91E63', '#00BCD4', '#9C27B0', '#CDDC39'
        ];
        
        this.pieGastos = {
          labels: data.distribucionGastos.labels,
          datasets: [{
            data: data.distribucionGastos.values,
            backgroundColor: expenseColors,
            borderColor: '#fff',
            borderWidth: 1
          }]
        };
      }

      // 5. Ticket Promedio
      if (data.ticketPromedio >= 0) {
        this.barTicketPromedio = {
          labels: ['Ticket Promedio'],
          datasets: [{
            label: 'Ticket (COP)', 
            data: [data.ticketPromedio],
            backgroundColor: '#2196F3', // Azul para métricas neutrales
            borderColor: '#1976D2',
            borderWidth: 1
          }]
        };
      }

      // 6. Productos más rentables
      if (data.productosRentables) {
        this.barProductosGanancia = {
          labels: data.productosRentables.labels,
          datasets: [{
            label: 'Ganancia total (COP)',
            data: data.productosRentables.values,
            backgroundColor: data.productosRentables.values.map((value: number) => 
              value >= 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)'
            ),
            borderColor: data.productosRentables.values.map((value: number) => 
              value >= 0 ? '#4CAF50' : '#F44336'
            ),
            borderWidth: 1
          }]
        };
      }
    },

    error: (err) => {
      console.error("❌ ERROR en /finanzas:", err);
    }
  });
}

  highlightPie(index: number) {
  }
  highlightBar(index: number) {
  }
}
