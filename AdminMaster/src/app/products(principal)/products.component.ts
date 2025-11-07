import { Component } from '@angular/core';
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { FooterComponent } from "../footer/footer.component";
import { NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
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
  imports: [NgFor,TitleCasePipe,MatButtonModule,NavBarComponent, FooterComponent, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent {
  constructor(private productoService: ProductoService) {}
  ngOnInit() {
    this.productoService.getAll().subscribe({
      next: (data) => this.cargarDesdeBackend(data || []),
      error: () => this.cargarDesdeBackend([])
    });
    this.productoService.getCount().subscribe({
      next: (res) => this.totalProductos = Number(res?.total ?? 0),
      error: () => this.totalProductos = 0
    });
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
    return base.filter(p => (p.nombre || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(q));
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

  private cargarDesdeBackend(lista: BackendProducto[]): void {
    const toImageUrl = (img?: string | null): string => {
      if (!img) return '';
      const s = String(img);
      if (s.startsWith('http') || s.startsWith('data:')) return s;
      return this.baseImageUrl + s.replace(/^\/+/, '');
    };
    const mapToLocal = (p: BackendProducto): ProductoCard => ({
      nombre: p.nombreProducto,
      precio: p.precioComercial ?? p.precioUnitario,
      imagen: toImageUrl(p.imgProducto),
      stock: p.stockProducto
    });
    const es = (p: BackendProducto, nombre: string) =>
      (p.categoria?.nombreCategoria || '').toLowerCase().includes(nombre) ||
      String(p.idCategoria || '').toLowerCase() === nombre;

    const pan = lista.filter(p => es(p, 'pan') || es(p, 'panaderia')).map(mapToLocal);
    const past = lista.filter(p => es(p, 'pastel') || es(p, 'pasteleria')).map(mapToLocal);
    const beb = lista.filter(p => es(p, 'bebida') || es(p, 'bebidas')).map(mapToLocal);

    this.productos = {
      panaderia: pan,
      pasteleria: past,
      bebidas: beb,
    };
    // Reiniciar a la primera página al cargar datos
    this.currentPage = 1;
  }

}
