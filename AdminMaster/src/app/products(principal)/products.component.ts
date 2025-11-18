import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { FooterComponent } from "../footer/footer.component";
import { isPlatformBrowser, NgFor, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ProductoService, Producto as BackendProducto } from '../services/producto.service';
import { FormsModule } from '@angular/forms';

type Categoria = 'panaderia' | 'pasteleria' | 'bebidas';

interface ProductoCard {
  nombre: string;
  precio: number;
  imagen: string;
  stock: number;
}


@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
  NgFor,
  FormsModule,
  TitleCasePipe,
  MatButtonModule,
  NavBarComponent,
  FooterComponent,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  constructor(private productoService: ProductoService,@Inject(PLATFORM_ID) private platformId: Object) { }

ngOnInit(): void {
  if (isPlatformBrowser(this.platformId)) {
    this.cargarProductos();
  } else {
    console.log("Error de Servidor");
  }
}

  categoriaSeleccionada: Categoria = 'panaderia';
  private baseImageUrl = 'http://localhost:3000/storage/';

  productos: Record<Categoria, ProductoCard[]> = {
    panaderia: [],
    bebidas: [],
    pasteleria: []
  };

  animarTitulo = false;
  // Búsqueda
  searchTerm: string = '';
  // Paginación
  pageSize = 12;
  currentPage = 1;

  totalProductos = 0;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.productosFiltrados.length / this.pageSize));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  seleccionarCategoria(categoria: Categoria) {
    this.categoriaSeleccionada = categoria;
    this.animarTitulo = false;
    this.currentPage = 1;
    setTimeout(() => this.animarTitulo = true, 50);
  }

  get productosFiltrados(): ProductoCard[] {
    const base = this.productos[this.categoriaSeleccionada] || [];
    const q = (this.searchTerm || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    if (!q) return base;
    return base.filter(p => {
      const nombre = (p.nombre ?? '').toString().toLowerCase();
      return nombre.includes(q);
    });
  }

  get paginatedProductos(): ProductoCard[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.productosFiltrados.slice(start, start + this.pageSize);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  private cargarProductos() {
    console.log('🔍 Iniciando carga de productos...');
    this.productoService.getPublic().subscribe({
      next: (data: any[]) => {
        console.log("✅ Datos recibidos del servidor:", data);
        if (!data || !Array.isArray(data)) {
          console.error('❌ Error: La respuesta del servidor no es un array:', data);
          return;
        }
        if (data.length === 0) {
          console.warn('⚠️ El servidor devolvió un array vacío de productos');
        }
        this.cargarDesdeBackend(data);
      },
      error: (err) => {
        console.error("❌ Error al obtener productos:", err);
        // Set default products for development
        if (err.status === 0) {
          console.warn('⚠️ No se pudo conectar al servidor. Verifica que el backend esté en ejecución.');
        }
        // Initialize with empty data to prevent template errors
        this.productos = {
          panaderia: [],
          pasteleria: [],
          bebidas: []
        };
        this.totalProductos = 0;
      },
      complete: () => {
        console.log('✅ Carga de productos completada');
      }
    });
  }

  private cargarDesdeBackend(productosBackend: any[]): void {
    console.log('🔄 Procesando', productosBackend.length, 'productos...');
    
    // Inicializar arrays para cada categoría
    const pan: ProductoCard[] = [];
    const past: ProductoCard[] = [];
    const beb: ProductoCard[] = [];
    
    // Función para normalizar URLs de imágenes
    const toImageUrl = (img?: string | null): string => {
      if (!img) return 'assets/img/placeholder.jpg'; // Imagen por defecto
      const s = String(img).trim();
      if (s.startsWith('http') || s.startsWith('data:')) return s;
      // Asegurar que la URL base termine con / y la ruta de la imagen no empiece con /
      const base = this.baseImageUrl.endsWith('/') ? this.baseImageUrl : this.baseImageUrl + '/';
      const path = s.startsWith('/') ? s.substring(1) : s;
      return base + path;
    };

    try {
      // Procesar cada producto
      productosBackend.forEach((prod: any) => {
        if (!prod) return; // Saltar productos nulos o indefinidos
        
        // Crear el objeto de producto
        const productoCard: ProductoCard = {
          nombre: prod.nombreProducto || 'Producto sin nombre',
          precio: prod.precioComercial ?? prod.precioUnitario ?? 0,
          imagen: toImageUrl(prod.imgProducto),
          stock: prod.stockProducto ?? 0
        };

        // Determinar la categoría
        const catNombre = (prod.categoria?.nombreCategoria || '').toLowerCase();
        const catId = String(prod.idCategoria || prod.categoria?.idCategoria || '').toLowerCase();

        if (catId === '1' || catNombre.includes('pan') || catNombre.includes('panaderia')) {
          pan.push(productoCard);
        } else if (catId === '2' || catNombre.includes('pastel') || catNombre.includes('pasteleria')) {
          past.push(productoCard);
        } else if (catId === '3' || catNombre.includes('bebida') || catNombre.includes('bebidas')) {
          beb.push(productoCard);
        } else {
          console.warn('Producto sin categoría definida:', prod);
          // Por defecto, lo ponemos en panadería
          pan.push(productoCard);
        }
      });

      // Actualizar el estado
      this.productos = {
        panaderia: pan,
        pasteleria: past,
        bebidas: beb
      };
      
      // Actualizar el contador total
      this.totalProductos = this.productos[this.categoriaSeleccionada]?.length || 0;
      
      // Reiniciar a la primera página
      this.currentPage = 1;
      this.animarTitulo = true;
      
      console.log(' Productos cargados correctamente:', {
        panaderia: pan.length,
        pasteleria: past.length,
        bebidas: beb.length
      });
      
    } catch (error) {
      console.error(' Error al procesar los productos:', error);
      // Asegurarse de que siempre haya una estructura válida
      this.productos = {
        panaderia: [],
        pasteleria: [],
        bebidas: []
      };
      this.totalProductos = 0;
    }
  }
}
