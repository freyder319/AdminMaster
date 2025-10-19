import { Component } from '@angular/core';
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { FooterComponent } from "../footer/footer.component";
import { NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ProductoService, Producto as BackendProducto } from '../services/producto.service';

type Categoria = 'panaderia' | 'pasteleria' | 'bebidas';

interface ProductoCard {
  nombre: string;
  precio: number;
  imagen: string;
}


@Component({
  selector: 'app-products',
  standalone: true,
  imports: [NgFor,TitleCasePipe,MatButtonModule,NavBarComponent, FooterComponent,RouterLink],
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
  }
  categoriaSeleccionada: Categoria = 'panaderia';
  private baseImageUrl = 'http://localhost:3000/storage/';

  productos: Record<Categoria, ProductoCard[]> = {
    panaderia: [],
    bebidas: [],
    pasteleria: []
  };

  animarTitulo = false;

  seleccionarCategoria(categoria: Categoria) {
    this.categoriaSeleccionada = categoria;
    this.animarTitulo = false;
    setTimeout(() => this.animarTitulo = true, 50);
  }

  get productosFiltrados(): ProductoCard[] {
    return this.productos[this.categoriaSeleccionada];
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
      imagen: toImageUrl(p.imgProducto)
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
  }

}
