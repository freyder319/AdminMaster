import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Categorias, CategoriaService } from '../services/categoria.service';

@Component({
  selector: 'app-create-producto',
  imports: [FormsModule,CommonModule],
  templateUrl: './create_producto.component.html',
  styleUrl: './create_producto.component.scss'
})
export class CreateProductoComponent {
  producto = {
  nombreProducto: '',
  codigoProducto: '',
  stockProducto: 0,
  precioUnitario: 0,
  precioComercial: 0,
  categoria: ''
};
  constructor(private categoriaService:CategoriaService){}
  @ViewChild('imagenInput') imagenInput!: ElementRef<HTMLInputElement>;
  previewUrl: string | ArrayBuffer | null = null;
  imagenSeleccionada: File | null = null;
  categorias:Categorias[]=[];
  mostrarPreview(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.imagenSeleccionada = file;
      const reader = new FileReader();
      reader.onload = e => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
  onSubmit() {
    console.log('Imagen:', this.imagenSeleccionada);
    // Aquí podrías enviar los datos y la imagen al backend con FormData
  }
  abrirSelectorImagen() {
    this.imagenInput.nativeElement.click();
  }
  ngOnInit():void{
    this.cargarTotal();
  }
  cargarTotal():void{
    this.categoriaService.getCategories().subscribe({
      next:(data)=>(this.categorias=data),
      error:(err)=> console.error('Error al obtener el total',err),
    });
  }
}
