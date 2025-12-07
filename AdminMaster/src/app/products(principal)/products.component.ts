import { Component, OnInit, Inject, PLATFORM_ID, ViewChildren, ViewChild, ElementRef, AfterViewInit, OnDestroy, QueryList } from '@angular/core';
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { FooterComponent } from "../footer/footer.component";
import { isPlatformBrowser, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ProductoService, Producto as BackendProducto } from '../services/producto.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../config/environment';

interface ProductoCard {
  nombre: string;
  precio: number;
  imagen: string;
  stock: number;
  categoriaId: number | null;
  categoriaNombre: string;
}

interface CategoriaUI {
  id: number;
  nombre: string;
}


@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
  NgFor,
  NgIf,
  FormsModule,
  MatButtonModule,
  NavBarComponent,
  FooterComponent,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('productsWrapper') productsWrappers?: QueryList<ElementRef<HTMLDivElement>>;
  private autoScrollId: any = null;
  @ViewChild('productsSection') productsSection?: ElementRef<HTMLElement>;
  @ViewChild('heroVideo') heroVideo?: ElementRef<HTMLVideoElement>;
  private sectionObserver?: IntersectionObserver;

  constructor(private productoService: ProductoService,@Inject(PLATFORM_ID) private platformId: Object) { }

ngOnInit(): void {
  if (isPlatformBrowser(this.platformId)) {
    this.cargarProductos();
  } else {
  }
}

  categorias: CategoriaUI[] = [];
  categoriaSeleccionadaId: number | null = null;
  categoriaSeleccionadaNombre: string = '';
  private baseImageUrl = `${environment.apiUrl}/storage/`;

  productos: ProductoCard[] = [];

  animarTitulo = false;
  animarCards = false;
  animarCardsCategoria = false;
  // Búsqueda
  searchTerm: string = '';
  // Paginación
  pageSize = 12; // hasta 3 carruseles de 10 productos por página
  currentPage = 1;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.productosFiltrados.length / this.pageSize));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  seleccionarCategoria(cat: CategoriaUI) {
    this.categoriaSeleccionadaId = cat.id;
    this.categoriaSeleccionadaNombre = cat.nombre;
    this.animarTitulo = false;
    this.currentPage = 1;
    setTimeout(() => this.animarTitulo = true, 50);
    this.dispararAnimacionCategoria();
  }

  get productosFiltrados(): ProductoCard[] {
    const raw = (this.searchTerm || '').toString();
    const q = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

    // Sin búsqueda: filtrar normalmente por categoría seleccionada
    if (!q) {
      return this.categoriaSeleccionadaId
        ? this.productos.filter(p => p.categoriaId === this.categoriaSeleccionadaId)
        : this.productos;
    }

    // Con búsqueda: ignorar categoría y buscar en TODOS los productos
    return this.productos.filter(p => {
      const nombreNormalizado = (p.nombre ?? '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
      return nombreNormalizado.includes(q);
    });
  }

  get paginatedProductos(): ProductoCard[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.productosFiltrados.slice(start, start + this.pageSize);
  }

  // Grupos de hasta 10 productos para múltiples carruseles apilados
  get carouselGroups(): ProductoCard[][] {
    const src = this.paginatedProductos;
    // Tamaño de grupo por carrusel: hasta 12 productos (coincide con pageSize)
    const size = 12;
    const groups: ProductoCard[][] = [];
    for (let i = 0; i < src.length; i += size) {
      groups.push(src.slice(i, i + size));
    }
    // Máximo 3 carruseles por página
    return groups.slice(0, 3);
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

    const raw = (this.searchTerm || '').toString();
    const q = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

    // Si se borra el texto, no tocamos la categoría: se mantiene la selección actual
    if (!q) {
      return;
    }

    // Buscar en TODOS los productos el primero que coincida
    const match = this.productos.find(p => {
      const nombreNormalizado = (p.nombre ?? '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
      return nombreNormalizado.includes(q);
    });

    if (match && match.categoriaId !== null) {
      this.categoriaSeleccionadaId = match.categoriaId;
      this.categoriaSeleccionadaNombre = match.categoriaNombre;
      this.dispararAnimacionCategoria();
    } else {
      // Si no hay coincidencias claras, quitamos categoría para mostrar "todas"
      this.categoriaSeleccionadaId = null;
      this.categoriaSeleccionadaNombre = 'Todas las categorías';
    }
  }

  // Interacción del usuario con el carrusel: pausar/reanudar auto-scroll
  onCarouselPointerDown(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.clearAutoScroll();
  }

  onCarouselPointerUp(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.setupAutoScroll();
  }

  ngAfterViewInit(): void {
    this.startAutoScrollIfMobile();
    this.setupSectionObserver();

    // Intentar forzar la reproducción del video de fondo cuando estemos en el navegador
    if (isPlatformBrowser(this.platformId) && this.heroVideo?.nativeElement) {
      const videoEl = this.heroVideo.nativeElement;
      // aseguramos que esté silenciado para cumplir políticas de autoplay
      videoEl.muted = true;
      videoEl.play().catch(() => {
        // Algunos navegadores aún pueden bloquearlo; en ese caso simplemente ignoramos el error
      });
    }
  }

  ngOnDestroy(): void {
    this.clearAutoScroll();
    if (this.sectionObserver) {
      this.sectionObserver.disconnect();
      this.sectionObserver = undefined;
    }
  }

  private cargarProductos() {
    this.productoService.getPublic().subscribe({
      next: (data: any[]) => {
        if (!data || !Array.isArray(data)) {
          console.error('Error: La respuesta del servidor no es un array:', data);
          return;
        }
        if (data.length === 0) {
          console.warn('El servidor devolvió un array vacío de productos');
        }
        this.cargarDesdeBackend(data);
      },
      error: (err) => {
        console.error("Error al obtener productos:", err);
        // Set default products for development
        if (err.status === 0) {
          console.warn('No se pudo conectar al servidor. Verifica que el backend esté en ejecución.');
        }
        // Inicializar con datos vacíos para evitar errores en el template
        this.productos = [];
        this.categorias = [];
      },
      complete: () => {
      }
    });
  }

  private cargarDesdeBackend(productosBackend: any[]): void {
    
    // Limpiar estructuras previas
    this.productos = [];
    this.categorias = [];
    const categoriasMap = new Map<number, string>();
    
    // Función para normalizar URLs de imágenes (compatible con producción)
    const toImageUrl = (img?: string | null): string => {
      if (!img) return 'assets/img/placeholder.jpg'; // Imagen por defecto
      const s = String(img).trim();
      if (s === '') return 'assets/img/placeholder.jpg';
      // URLs absolutas a localhost: reescribir hacia environment.apiUrl
      if (s.startsWith('http://localhost') || s.startsWith('https://localhost')) {
        try {
          const url = new URL(s);
          const path = url.pathname.replace(/^\/+/, '');
          const baseApi = environment.apiUrl.replace(/\/+$/, '');
          return `${baseApi}/${path}`;
        } catch {
          // Si falla, seguir flujo normal
        }
      }
      // Otras URLs absolutas o data URI
      if (s.startsWith('http') || s.startsWith('data:')) return s;
      // Rutas tipo '/storage/archivo.jpg' o 'storage/archivo.jpg'
      if (s.startsWith('/storage/') || s.startsWith('storage/')) {
        const clean = s.replace(/^\/+/, '');
        const baseApi = environment.apiUrl.replace(/\/+$/, '');
        return `${baseApi}/${clean}`;
      }
      // Caso general: nombre de archivo relativo almacenado en storage
      const base = this.baseImageUrl.endsWith('/') ? this.baseImageUrl : this.baseImageUrl + '/';
      const path = s.replace(/^\/+/, '');
      return base + path;
    };

    // Procesar cada producto
    productosBackend.forEach((prod: any) => {
      if (!prod) return; // Saltar productos nulos o indefinidos
      
      const catIdRaw = prod.idCategoria ?? prod.categoria?.idCategoria;
      const catId = (catIdRaw !== undefined && catIdRaw !== null) ? Number(catIdRaw) : null;
      const catNombre = prod.categoria?.nombreCategoria || 'Sin categoría';

      // Crear el objeto de producto
      const productoCard: ProductoCard = {
        nombre: prod.nombreProducto || 'Producto sin nombre',
        precio: prod.precioComercial ?? prod.precioUnitario ?? 0,
        imagen: toImageUrl(prod.imgProducto),
        stock: prod.stockProducto ?? 0,
        categoriaId: catId,
        categoriaNombre: catNombre,
      };

      this.productos.push(productoCard);

      if (catId !== null && !categoriasMap.has(catId)) {
        categoriasMap.set(catId, catNombre);
      }
    });

    // Actualizar lista de categorías únicas
    this.categorias = Array.from(categoriasMap.entries())
      .map(([id, nombre]) => ({ id, nombre }));

    // Seleccionar por defecto la primera categoría disponible
    if (this.categorias.length > 0) {
      this.categoriaSeleccionadaId = this.categorias[0].id;
      this.categoriaSeleccionadaNombre = this.categorias[0].nombre;
    } else {
      this.categoriaSeleccionadaId = null;
      this.categoriaSeleccionadaNombre = '';
      this.categorias = [];
    }
  }

  private startAutoScrollIfMobile(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      if (typeof window !== 'undefined' && window.innerWidth <= 880) {
        this.setupAutoScroll();
      } else {
        this.clearAutoScroll();
      }
    } catch {}
  }

  private setupSectionObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.productsSection) return;

    try {
      if (typeof window === 'undefined' || !(window as any).IntersectionObserver) {
        return;
      }

      this.sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Activa animación solo la primera vez que entra en vista
            this.animarCards = true;

            // Desactiva la clase después de que termine la animación CSS
            setTimeout(() => {
              this.animarCards = false;
            }, 800);

            // Desconectar el observer para que no vuelva a dispararse
            if (this.sectionObserver) {
              this.sectionObserver.disconnect();
              this.sectionObserver = undefined;
            }
          }
        });
      }, { threshold: 0.35 });

      this.sectionObserver.observe(this.productsSection.nativeElement);
    } catch {
      // si falla el observer, simplemente no animamos
    }
  }

  private dispararAnimacionCategoria(): void {
    // Activa una animación corta cada vez que se cambia de categoría
    this.animarCardsCategoria = false;
    // pequeño truco para reiniciar la animación si estaba activa
    setTimeout(() => {
      this.animarCardsCategoria = true;
      setTimeout(() => {
        this.animarCardsCategoria = false;
      }, 650);
    }, 0);
  }

  private setupAutoScroll(): void {
    if (typeof window === 'undefined') return;
    if (window.innerWidth > 880) {
      this.clearAutoScroll();
      return;
    }
    this.clearAutoScroll();
    const wrappers = this.productsWrappers?.toArray() || [];
    if (!wrappers.length) return;
    // Movimiento suave pero visible: pasos algo más grandes
    const stepMs = 120; // cada 120ms
    this.autoScrollId = setInterval(() => {
      const ws = this.productsWrappers?.toArray() || [];
      ws.forEach(w => {
        const el = w.nativeElement;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll <= 0) return;
        const current = el.scrollLeft;
        const delta = Math.max(2, el.clientWidth * 0.06); // 6% del ancho visible por paso
        let next = current + delta;
        if (next >= maxScroll - 1) {
          next = 0;
        }
        el.scrollTo({ left: next, behavior: 'smooth' });
      });
    }, stepMs);
  }

  private clearAutoScroll(): void {
    if (this.autoScrollId) {
      clearInterval(this.autoScrollId);
      this.autoScrollId = null;
    }
  }
}
