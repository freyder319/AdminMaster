import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Categorias, CategoriaService } from '../services/categoria.service';
import { Producto, ProductoService } from '../services/producto.service';
import Swal from 'sweetalert2';
declare const bootstrap: any;

@Component({
  selector: 'app-create-producto',
  imports: [FormsModule,CommonModule],
  templateUrl: './create_producto.component.html',
  styleUrls: ['./create_producto.component.scss']
})
export class CreateProductoComponent implements OnInit {
  @Input() productoInicial: Producto | null = null;
  @Input() editMode: boolean = false;
  @Input() titulo: string = 'Crear Producto';
  @Output() guardado = new EventEmitter<void>();

  producto: any = {
    nombreProducto: '',
    codigoProducto: '',
    stockProducto: 0,
    precioUnitario: 0,
    precioComercial: 0,
    categoria: ''
  };
  constructor(private categoriaService:CategoriaService, private productoService: ProductoService){}
  @ViewChild('imagenInput') imagenInput!: ElementRef<HTMLInputElement>;
  @ViewChild('formulario') formRef!: NgForm;
  previewUrl: string | ArrayBuffer | null = null;
  imagenSeleccionada: File | null = null;
  categorias:Categorias[]=[];
  codigoExistente = false;
  mostrarPreview(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.imagenSeleccionada = file;
    this.convertToBase64JPEG(file, 1200, 1200, 0.8)
      .then((base64) => {
        this.previewUrl = base64;
      })
      .catch(() => {
        // Fallback: if conversion fails, use raw base64
        const reader = new FileReader();
        reader.onload = () => (this.previewUrl = reader.result);
        reader.readAsDataURL(file);
      });
  }
  private convertToBase64JPEG(file: File, maxW = 1200, maxH = 1200, quality = 0.85): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = reject;
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          // Resize preserving aspect ratio
          let { width, height } = img;
          const scale = Math.min(maxW / width, maxH / height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(width * scale);
          canvas.height = Math.floor(height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('No 2D context');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Export as JPEG for wide compatibility
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = String(fr.result);
      };
      fr.readAsDataURL(file);
    });
  }
  validarCodigo(): void {
    const codigo = (this.producto.codigoProducto || '').trim();
    if (!codigo) { this.codigoExistente = false; return; }
    this.productoService.getAll().subscribe({
      next: (lista) => {
        const existe = (lista || []).some((p: any) => {
          const mismoId = this.editMode && this.productoInicial?.id === p.id;
          return !mismoId && String(p.codigoProducto || '').trim().toLowerCase() === codigo.toLowerCase();
        });
        this.codigoExistente = !!existe;
      },
      error: () => this.codigoExistente = false
    });
  }
  onCodigoInput(value: string) {
    const limpio = String(value || '').replace(/[^A-Za-z0-9]/g, '');
    this.producto.codigoProducto = limpio;
    this.codigoExistente = false;
  }
  onSubmit() {
    // Sanitizar valores no negativos
    const stock = Math.max(0, Number(this.producto.stockProducto) || 0);
    const pu = Math.max(0, Number(this.producto.precioUnitario) || 0);
    const pc = Math.max(0, Number(this.producto.precioComercial) || 0);
    const payload: Partial<Producto> = {
      nombreProducto: this.producto.nombreProducto,
      codigoProducto: this.producto.codigoProducto,
      stockProducto: stock,
      precioUnitario: pu,
      precioComercial: pc,
      // Si no hay imagen seleccionada en creación, usar imagen por defecto
      imgProducto: typeof this.previewUrl === 'string'
        ? this.previewUrl
        : (this.editMode
            ? this.productoInicial?.imgProducto
            : 'default.jpg'),
    };
    if (this.codigoExistente) { return; }
    if (this.producto.categoria) {
      payload.idCategoria = Number(this.producto.categoria);
    }

    if (this.editMode && this.productoInicial?.id) {
      this.productoService.update(this.productoInicial.id, payload).subscribe({
        next: () => {
          Swal.fire('Producto Modificado', 'Se actualizó correctamente.', 'success');
          this.guardado.emit();
          // Reset de estados visuales
          this.codigoExistente = false;
          this.formRef?.resetForm({
            nombreProducto: '', codigoProducto: '', stockProducto: 0,
            precioUnitario: 0, precioComercial: 0, categoria: ''
          });
          this.previewUrl = null;
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'No se pudo actualizar el producto', 'error');
        }
      });
    } else {
      this.productoService.create(payload).subscribe({
        next: () => {
          Swal.fire('Producto Creado', 'Se registró correctamente.', 'success');
          this.closeOffcanvas();
          this.resetForm();
          this.guardado.emit();
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'No se pudo crear el producto', 'error');
        }
      });
    }
  }
  private closeOffcanvas() {
    const el = document.querySelector('.offcanvas.show') as HTMLElement | null;
    if (!el) return;
    try {
      const instance = bootstrap?.Offcanvas?.getInstance(el) || new bootstrap.Offcanvas(el);
      instance?.hide();
    } catch {
      const btn = el.querySelector('.btn-close') as HTMLElement | null;
      btn?.click();
    }
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
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productoInicial']) {
      if (this.productoInicial) {
        this.editMode = true;
        this.producto = {
          nombreProducto: this.productoInicial.nombreProducto,
          codigoProducto: this.productoInicial.codigoProducto,
          stockProducto: this.productoInicial.stockProducto,
          precioUnitario: this.productoInicial.precioUnitario,
          precioComercial: this.productoInicial.precioComercial,
          categoria: this.productoInicial.idCategoria || this.productoInicial.categoria?.idCategoria || ''
        };
        this.previewUrl = this.productoInicial.imgProducto || null;
      } else {
        this.editMode = false;
        this.resetForm();
      }
    }
  }
  private resetForm() {
    const initial = {
      nombreProducto: '',
      codigoProducto: '',
      stockProducto: 0,
      precioUnitario: 0,
      precioComercial: 0,
      categoria: ''
    };
    this.producto = { ...initial };
    this.previewUrl = null;
    this.imagenSeleccionada = null;
    this.codigoExistente = false;
    // Reset de estados del formulario a pristine/untouched
    this.formRef?.resetForm(initial);
  }
}
