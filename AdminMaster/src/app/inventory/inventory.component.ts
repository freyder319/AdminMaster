import { Component, ViewChild } from '@angular/core';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { CreateProductoComponent } from "../create_producto/create_producto.component";
import { FormGroup, FormsModule, NgForm } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Producto, ProductoService } from '../services/producto.service';
import { Categorias, CategoriaService } from '../services/categoria.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

declare var bootstrap: any; // Declaración para acceder a Bootstrap

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [AdminNavbarComponent,CreateProductoComponent,FormsModule,MatPaginatorModule,CommonModule,],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent {
  errorMessage: string = ''; 
  totalItems:number=0;     // total de productos 
  CostoTotal=0;
  pageSize = 15;       // cuantos mostrar por página
  pageIndex = 0;       // página actual
  pageWindow = 5;      // cantidad de botones visibles
  categorias:Categorias[] = [];
  entrada:any={
    codigo:'',
    cantidad:0
  }
  categoria:any={
    nombreCategoria:''
  }
  // Productos filtrados en tiempo real (categoría + texto)
  get productosFiltrados(): Producto[] {
    const q = (this.searchTerm || '').trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    // Filtrar por categoría primero si hay selección
    let lista = this.productos;
    if (this.selectedCategoryId !== '') {
      const sel = Number(this.selectedCategoryId);
      lista = lista.filter(p => (p.categoria?.idCategoria ?? p.idCategoria) == sel);
    }
    if (tokens.length === 0) return lista;
    const contiene = (val?: any, t?: string) =>
      (String(val || '').toLowerCase().includes(t || ''));
    return lista.filter(p =>
      tokens.every(t =>
        contiene(p.nombreProducto, t) ||
        contiene(p.codigoProducto, t) ||
        contiene(p.categoria?.nombreCategoria, t)
      )
    );
  }
  categoriaModificar: any = {
    idCategoria: null,
    nombreCategoria: ''
  };
  productoEncontrado: Producto | null = null;
  categoriaSeleccionada?: Categorias;
  modificarActivo=false;
  // Productos
  productos: Producto[] = [];
  productoSeleccionado: Producto | null = null;
  tituloOffcanvas = 'Crear Producto';
  private baseImageUrl = 'http://localhost:3000/storage/';
  // Buscador
  searchTerm: string = '';
  // Filtro por categoría (idCategoria o nombre)
  selectedCategoryId: number | '' = '';
  get selectedCategoryName(): string {
    if (this.selectedCategoryId === '') return 'todas';
    const cat = this.categorias.find(c => c.idCategoria == Number(this.selectedCategoryId));
    return cat?.nombreCategoria || String(this.selectedCategoryId);
  }
  constructor(
    private productoService:ProductoService,
    private categoriaService:CategoriaService
  ){}
  ngOnInit():void{
    this.cargarTotal();
    this.cargarProductos();
  }
  buscarProductoPorCodigo() {
    if (!this.entrada.codigo) {
      this.productoEncontrado = null;
      return;
    }
    
    this.productoService.buscarPorCodigo(this.entrada.codigo).subscribe({
      next: (data) => {
        this.productoEncontrado = data;
      },
      error: (err) => {
        console.error('Error al buscar producto por código', err);
        this.productoEncontrado = null;
      }
    });
  }

  registrarEntrada(form: NgForm) {
    if (!this.productoEncontrado) {
      // Si no hay un producto encontrado, intentar buscarlo primero
      this.buscarProductoPorCodigo();
      return;
    }
    
    if (form.valid && this.entrada.cantidad > 0 && this.productoEncontrado.id) {
      // Asegurarse de que el stock actual sea un número
      const stockActual = Number(this.productoEncontrado.stockProducto) || 0;
      const cantidadEntrante = Number(this.entrada.cantidad) || 0;
      const nuevaCantidad = stockActual + cantidadEntrante;
      
      console.log('Actualizando stock:', {
        productoId: this.productoEncontrado.id,
        stockActual,
        cantidadEntrante,
        nuevaCantidad
      });
      
      this.productoService.actualizarStock(this.productoEncontrado.id, nuevaCantidad).subscribe({
        next: (productoActualizado) => {
          console.log('Stock actualizado correctamente:', productoActualizado);
          Swal.fire({
            icon: 'success',
            title: '¡Entrada registrada!',
            text: `Se agregaron ${cantidadEntrante} unidades al producto`,
            showConfirmButton: false,
            timer: 2000
          });
          // Actualizar la lista de productos
          this.cargarProductos();
          this.cargarTotal();
          // Limpiar el formulario
          form.resetForm();
          this.productoEncontrado = null;
          // Cerrar el modal después de 2 segundos
          setTimeout(() => {
            const modalElement = document.getElementById('modalEntradaInventario');
            if (modalElement) {
              // Usar el método nativo de Bootstrap 5
              const modal = bootstrap.Modal.getInstance(modalElement);
              if (modal) {
                modal.hide();
              } else {
                // Si no hay instancia, crear una nueva y ocultarla
                new bootstrap.Modal(modalElement).hide();
              }
            }
          }, 2000);
        },
        error: (err) => {
          console.error('Error al actualizar el stock:', err);
          let mensajeError = 'No se pudo actualizar el inventario';
          
          if (err.error?.message) {
            mensajeError = err.error.message;
          } else if (err.status === 404) {
            mensajeError = 'Producto no encontrado';
          } else if (err.status === 400) {
            mensajeError = 'Datos inválidos para actualizar el stock';
          }
          
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: mensajeError,
            confirmButtonText: 'Entendido'
          });
        }
      });
    }
  }
  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    console.log('Página actual:', this.pageIndex, ' | Tamaño:', this.pageSize);
  }
  // Productos paginados según pageIndex y pageSize
  get paginatedProductos(): Producto[] {
    const start = this.pageIndex * this.pageSize;
    return this.productosFiltrados.slice(start, start + this.pageSize);
  }
  // Total de páginas basado en el filtro actual
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.productosFiltrados.length / this.pageSize));
  }
  // Arreglo de páginas para la navegación [0,1,2,...]
  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
  // Ventana compacta de paginación con elipsis (-1)
  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.pageIndex;
    const win = Math.max(3, this.pageWindow);
    if (total <= win + 2) return this.pages; // no necesita elipsis
    let start = Math.max(0, current - Math.floor(win / 2));
    let end = start + win - 1;
    if (end > total - 1) {
      end = total - 1;
      start = Math.max(0, end - (win - 1));
    }
    const list: number[] = [];
    if (start > 0) {
      list.push(0);
      if (start > 1) list.push(-1); // elipsis izquierda
    }
    for (let i = start; i <= end; i++) list.push(i);
    if (end < total - 1) {
      if (end < total - 2) list.push(-1); // elipsis derecha
      list.push(total - 1);
    }
    return list;
  }
  // Cambiar a una página específica
  goToPage(index: number): void {
    if (index < 0 || index > this.totalPages - 1) return;
    this.pageIndex = index;
  }
  goToFirst(): void { this.goToPage(0); }
  goToLast(): void { this.goToPage(this.totalPages - 1); }
  cargarTotal():void{
    this.productoService.getCount().subscribe({
      next:(res)=>(this.totalItems=res.total),
      error:(err)=> console.error('Error al obtener el total',err),
    });
    this.productoService.getTotalMoney().subscribe({
      next:(res)=>(this.CostoTotal=res.total),
      error:(err)=> console.error('Error al obtener el total',err),
    });
    this.categoriaService.getCategories().subscribe({
      next:(data)=>(this.categorias=data),
      error:(err)=> console.error('Error al obtener el total',err),
    });
  }
  cargarProductos(): void {
    this.productoService.getAll().subscribe({
      next: (data) => {
        this.productos = data || [];
        // Asegurar que la página actual sea válida cuando cambie la data
        if (this.pageIndex > this.totalPages - 1) {
          this.pageIndex = 0;
        }
      },
      error: (err) => console.error('Error al listar productos', err)
    });
  }
  abrirCrear() {
    this.productoSeleccionado = null;
    this.tituloOffcanvas = 'Crear Producto';
  }
  abrirEditar(prod: Producto) {
    this.productoSeleccionado = { ...prod };
    this.tituloOffcanvas = 'Modificar Producto';
  }
  onGuardado() {
    this.cargarProductos();
    this.cargarTotal();
  }
  onSearchChange(): void {
    // Reiniciar a la primera página en cada cambio de búsqueda
    this.pageIndex = 0;
  }
  onCategoryChange(): void {
    // Reiniciar a la primera página al cambiar la categoría
    this.pageIndex = 0;
  }
  eliminarProducto(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el producto.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService.delete(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Producto eliminado correctamente', 'success');
            this.onGuardado();
          },
          error: (err) => {
            // Priorizar mensaje del servidor (por ejemplo, FK violation: producto enlazado a una venta)
            let mensaje = err?.error?.message || 'Ocurrió un error al eliminar el producto';
            if (!err?.error?.message) {
              if (err.status >= 500) mensaje = 'Error en el servidor. Intente más tarde.';
              else if (err.status === 404) mensaje = 'El producto no existe o ya fue eliminado.';
              else if (err.status === 400) mensaje = 'Solicitud inválida.';
            }
            Swal.fire('Error', mensaje, 'error');
          }
        });
      }
    });
  }
  toImageUrl(img?: string | null): string {
    if (!img) return this.baseImageUrl + 'default.jpg';
    const s = String(img).trim();
    if (s === '') return this.baseImageUrl + 'default.jpg';
    // Normalizar diferentes nombres de default anteriores (p.ej. default.png, default-product.png)
    if (s.toLowerCase().startsWith('default') && s.toLowerCase() !== 'default.jpg') {
      return this.baseImageUrl + 'default.jpg';
    }
    if (s.startsWith('http') || s.startsWith('data:')) return s;
    return this.baseImageUrl + s.replace(/^\/+/, '');
  }
  agregarCategoria(form:NgForm){
    this.categoriaService.createCategorie(this.categoria).subscribe({
          next:()=>{
            Swal.fire({
              title: "Categoria Registrado!",
              icon: "success",
              html: `La Categoria <b>${this.categoria.nombreCategoria} </b> fue registrada con éxito`,
              draggable: true
            });
            this.categoria={
              nombreCategoria:'',
            }
            this.ngOnInit();
            form.resetForm(); 
          },
          error: (err) => {
            console.log(err)
            if (err.status === 400) {
              this.errorMessage = err.error.message;
            } else {
              this.errorMessage = 'Error inesperado';
            }
            Swal.fire({
              title: "Error",
              icon: "error",
              text: this.errorMessage,
            });
          }
        })
  }
  eliminarCategoria(id:number){
    Swal.fire({
        title: "Estas Seguro?",
        html: `Realmente Deseas Eliminar La Categoria</b>?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Si, Eliminar!"
      }).then((result) => {
        if (result.isConfirmed) {
          this.categoriaService.deleteCategorie(id).subscribe({
            next: () => {
              Swal.fire({
                title: "Eliminado!",
                html: `Categoria Eliminada.`,
                icon: "success"
              })
              this.ngOnInit();
            },
            error: (err)=> {
              let mensaje = 'Ocurrió un error al eliminar el cliente';
              if (err.status >= 500) {
                mensaje = 'Error en el servidor. Intente más tarde.';
              } else if (err.status === 404) {
                mensaje = 'La Categoria no existe o ya fue eliminada.';
              } else if (err.status === 400) {
                mensaje = 'Solicitud inválida.';
              }
              Swal.fire({
                icon: "error",
                title: "Error...",
                text: mensaje,
              });
            }
          })
          
        }
      });
  }
  abrirModal(cate:any){
    this.categoriaModificar = { ...cate}
  }
  modificarCategoria(id:number,categoriaModificar:any){
    if(categoriaModificar.nombreCategoria==''){
      Swal.fire("Error","El campo no puede estar vacio", "error");
    }else{
    this.categoriaService.updateCategorie(id,categoriaModificar).subscribe({
      next:(respuesta)=> {
        Swal.fire("Categoria Modificada", `Se Actualizó <strong>${respuesta.nombreCategoria}</strong> Correctamente.`, "success");
        this.ngOnInit()
      },
      error: (error) => {
        if (error.status === 404) {
          Swal.fire("No Encontrada", "La Categoria NO Existe (404).", "error");
        } else if (error.status === 500) {
          Swal.fire("Error del servidor", "Ocurrió un Error Interno (500). Intenta más Tarde.", "error");
        } else {
          Swal.fire("Error", `No se Pudo Modificar la Categoria. Código: ${error.status}`, "error");
        }
        console.error("Error al Modificar Caja:", error);
        }
    });
  }
  }
  apiImage="http://localhost:3000/storage/";
}