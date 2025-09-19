import { Component } from '@angular/core';
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { FooterComponent } from "../footer/footer.component";
import { NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

type Categoria = 'panaderia' | 'pasteleria' | 'bebidas';

interface Producto {
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

  // ngOnInit() {
  //   this.productosService.getProductos().subscribe(data => {
  //     this.productos = data;
  //   });
  // }

  categoriaSeleccionada: Categoria = 'panaderia';

  productos: Record<Categoria, Producto[]> = {
    panaderia: [
      { nombre: 'Croasant de France', precio: 800, imagen: 'croasant.jpg' },
      { nombre: 'Pan de Yuca', precio: 900, imagen: 'pandeyuca.jpg' },
      { nombre: 'Pastel de Pollo', precio: 2000, imagen: 'pastelpollo.jpg' },
      { nombre: 'Almohabana The Best', precio: 900, imagen: 'almohabana.jpg' },
      { nombre: 'Croasant de France', precio: 800, imagen: 'croasant.jpg' },
      { nombre: 'Pan de Yuca', precio: 900, imagen: 'pandeyuca.jpg' },
      { nombre: 'Pastel de Pollo', precio: 2000, imagen: 'pastelpollo.jpg' },
      { nombre: 'Almohabana The Best', precio: 900, imagen: 'almohabana.jpg' }
    ],
    bebidas: [
      { nombre: 'Coca Cola 1.5 L', precio: 3000, imagen: 'cocacola.jpg' },
      { nombre: 'Speed Max', precio: 2000, imagen: 'speed.jpg' },
      { nombre: 'Pony Malta Personal', precio: 2500, imagen: 'ponymalta.jpg' },
      { nombre: 'Colombiana 1.5 L', precio: 3500, imagen: 'colombiana.jpg' },
      { nombre: 'Coca Cola 1.5 L', precio: 3000, imagen: 'cocacola.jpg' },
      { nombre: 'Speed Max', precio: 2000, imagen: 'speed.jpg' },
      { nombre: 'Pony Malta Personal', precio: 2500, imagen: 'ponymalta.jpg' },
      { nombre: 'Colombiana 1.5 L', precio: 3500, imagen: 'colombiana.jpg' }
    ],
    pasteleria: [
      { nombre: 'Torta Fria Libra', precio: 40000, imagen: 'tortafrialibra.png' },
      { nombre: 'Torta Fria Media Libra', precio: 20000, imagen: 'tortafriamedialibra.jpg' },
      { nombre: 'Cup Cakes Suspiros', precio: 3000, imagen: 'cupcake.png' },
      { nombre: 'Postre de Maracuyá', precio: 3000, imagen: 'postresmaracuya.png' },
      { nombre: 'Torta Fria Libra', precio: 40000, imagen: 'tortafrialibra.png' },
      { nombre: 'Torta Fria Media Libra', precio: 20000, imagen: 'tortafriamedialibra.jpg' },
      { nombre: 'Cup Cakes Suspiros', precio: 3000, imagen: 'cupcake.png' },
      { nombre: 'Postre de Maracuyá', precio: 3000, imagen: 'postresmaracuya.png' }
    ]
  };

  animarTitulo = false;

  seleccionarCategoria(categoria: Categoria) {
    this.categoriaSeleccionada = categoria;
    this.animarTitulo = false;
    setTimeout(() => this.animarTitulo = true, 50);
  }

  get productosFiltrados(): Producto[] {
    return this.productos[this.categoriaSeleccionada];
  }


}
