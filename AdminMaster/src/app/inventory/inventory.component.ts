import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { CreateProductoComponent } from "../create_producto/create_producto.component";
import { FormGroup, FormsModule, NgForm } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Producto, ProductoService } from '../services/producto.service';
import { Categorias, CategoriaService } from '../services/categoria.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { AgenteIAComponent } from "../agente-ia/agente-ia.component";
import { environment } from '../config/environment';

declare var bootstrap: any; // Declaración para acceder a Bootstrap

@Component({

  selector: 'app-inventory',
  standalone: true,
  imports: [AdminNavbarComponent, CreateProductoComponent, FormsModule, MatPaginatorModule, CommonModule, AgenteIAComponent],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements AfterViewInit {

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
  private buscarCodigoTimer: any = null;
  mensajeProducto: string = 'Ingresa un Código Válido para ver Detalles del Producto.';
  mostrarIconoNoEncontrado: boolean = false;
  nombreCategoriaDuplicado: boolean = false;
  // Flag para controlar si el modal de entrada viene desde habilitar con stock 0
  private focusCantidadOnEntrada: boolean = false;
  // Mapa para saber si cada producto puede ser eliminado (sin ventas asociadas)
  private canDeleteMap: Record<number, boolean> = {};
  canDeleteFlag(p?: Producto | null): boolean {
    if (!p?.id) return true;
    const v = this.canDeleteMap[p.id];
    return v === undefined ? true : v;
  }
  toggleEstado(prod: Producto) {
    if (!prod?.id) return;
    const nuevo = !(prod.estado === false ? false : true);
    // Evitar habilitar productos con stock en 0: deben registrar entradas primero
    if (nuevo === true && (Number(prod.stockProducto) || 0) <= 0) {
      Swal.fire({
        icon: 'info',
        title: 'Stock Insuficiente',
        html: 'Para <b>Habilitar</b> este Producto debes <b>Registrar Primero una Entrada</b> que <b>Aumente su Stock</b>.'
      }).then(() => {
        try {
          // Preconfigurar el formulario de entrada con el código del producto
          this.entrada = {
            codigo: String(prod.codigoProducto || ''),
            cantidad: 0
          };
          // Mostrar de inmediato los datos del producto en el panel derecho
          this.productoEncontrado = { ...prod };
          this.mensajeProducto = '';
          this.mostrarIconoNoEncontrado = false;
          // Indicar que al abrir el modal se debe enfocar la cantidad
          this.focusCantidadOnEntrada = true;
          // Abrir modal de Entrada de Productos
          const modalElement = document.getElementById('modalEntradaInventario');
          if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modal.show();
          }
        } catch {}
      });
      return;
    }
    this.productoService.setEstado(prod.id, nuevo).subscribe({
      next: (actualizado) => {
        // Actualizar en memoria
        const idx = this.productos.findIndex(p => p.id === prod.id);
        if (idx >= 0) this.productos[idx] = { ...this.productos[idx], ...actualizado };
      },
      error: (err) => {
        const msg = err?.error?.message || 'No se pudo Cambiar el Estado del Producto';
        Swal.fire('Error', msg, 'error');
      }
    });
  }
  // Productos filtrados en tiempo real (categoría + texto) y ordenados (habilitados primero)
  get productosFiltrados(): Producto[] {
    const q = (this.searchTerm || '').trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    // Filtrar por categoría primero si hay selección
    let lista = this.productos;
    if (this.selectedCategoryId !== '') {
      const sel = Number(this.selectedCategoryId);
      lista = lista.filter(p => (p.categoria?.idCategoria ?? p.idCategoria) == sel);
    }
    // Ordenar: habilitados primero, luego por nombre
    lista = [...lista].sort((a, b) => {
      const ah = (a.estado === false || (a.stockProducto ?? 0) === 0) ? 0 : 1;
      const bh = (b.estado === false || (b.stockProducto ?? 0) === 0) ? 0 : 1;
      if (ah !== bh) return bh - ah; // 1 (true) primero
      return String(a.nombreProducto || '').localeCompare(String(b.nombreProducto || ''));
    });
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
  nombreCategoriaModificarDuplicado: boolean = false;
  productoEncontrado: Producto | null = null;
  categoriaSeleccionada?: Categorias;
  modificarActivo=false;
  // Productos
  productos: Producto[] = [];
  productoSeleccionado: Producto | null = null;
  tituloOffcanvas = 'Crear Producto';
  private baseImageUrl = `${environment.apiUrl}/storage/`;
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
  @ViewChild('codigoInput') codigoInput?: ElementRef<HTMLInputElement>;
  @ViewChild('cantidadInput') cantidadInput?: any; // referencia al NgModel en la plantilla
  @ViewChild('cantidadInputEl') cantidadInputEl?: ElementRef<HTMLInputElement>;
  @ViewChild('nombreCategoriaInput') nombreCategoriaInput?: ElementRef<HTMLInputElement>;
  @ViewChild('nombreCategoriaModificarInput') nombreCategoriaModificarInput?: ElementRef<HTMLInputElement>;

  ngAfterViewInit(): void {
    const modalElement = document.getElementById('modalEntradaInventario');
    if (modalElement) {
      modalElement.addEventListener('shown.bs.modal', () => {
        // Si venimos desde habilitar con stock 0, enfocar cantidad; si no, código
        if (this.focusCantidadOnEntrada && this.cantidadInputEl?.nativeElement) {
          this.cantidadInputEl.nativeElement.focus();
          this.cantidadInputEl.nativeElement.select();
          this.focusCantidadOnEntrada = false;
        } else if (this.codigoInput?.nativeElement) {
          this.codigoInput.nativeElement.focus();
          this.codigoInput.nativeElement.select();
        }
      });
    }

    const offcanvasCat = document.getElementById('offcanvasCrearCategoria');
    if (offcanvasCat) {
      offcanvasCat.addEventListener('shown.bs.offcanvas', () => {
        setTimeout(() => {
          if (this.nombreCategoriaInput?.nativeElement) {
            this.nombreCategoriaInput.nativeElement.focus();
            this.nombreCategoriaInput.nativeElement.select();
          }
        }, 0);
      });
    }

    const modalModificar = document.getElementById('staticBackdrop');
    if (modalModificar) {
      modalModificar.addEventListener('shown.bs.modal', () => {
        setTimeout(() => {
          if (this.nombreCategoriaModificarInput?.nativeElement) {
            this.nombreCategoriaModificarInput.nativeElement.focus();
            this.nombreCategoriaModificarInput.nativeElement.select();
          }
        }, 0);
      });
    }
  }

  onAbrirEntradaInventario(): void {
    // Limpiar modelo de entrada cuando se abre el modal
    this.entrada = { codigo: '', cantidad: 0 };
    this.productoEncontrado = null;
    this.mensajeProducto = 'Ingresa un Código Válido para ver Detalles del Producto.';
    this.mostrarIconoNoEncontrado = false;
    // En este flujo normal, queremos enfocar el código, no la cantidad
    this.focusCantidadOnEntrada = false;

    // Reforzar que el input de código quede listo para escribir
    setTimeout(() => {
      if (this.codigoInput?.nativeElement) {
        this.codigoInput.nativeElement.focus();
        this.codigoInput.nativeElement.select();
      }
    }, 0);
  }

  ngOnInit():void{
    this.cargarTotal();
    this.cargarProductos();
  }
  buscarProductoPorCodigo() {

    // Se llama en cada tecla, pero retrasamos la búsqueda real
    if (this.buscarCodigoTimer) {
      clearTimeout(this.buscarCodigoTimer);
    }

    this.buscarCodigoTimer = setTimeout(() => {
      if (!this.entrada.codigo) {
        this.productoEncontrado = null;
        this.mensajeProducto = 'Ingresa un Código Válido para ver Detalles del Producto.';
        this.mostrarIconoNoEncontrado = false;
        return;
      }

      // Guardar el código que se está buscando para evitar efectos de respuestas antiguas
      const codigoBuscado = this.entrada.codigo;

      this.productoService.buscarPorCodigo(codigoBuscado).subscribe({
        next: (data: Producto | null) => {

          // Si mientras llegaba la respuesta el usuario cambió el código, ignorar esta respuesta
          if (this.entrada.codigo !== codigoBuscado && this.entrada.codigo !== '') {
            return;
          }
          this.productoEncontrado = data;
          if (this.productoEncontrado) {
            this.mensajeProducto = '';
            this.mostrarIconoNoEncontrado = false;

            // Pasar el foco al input de cantidad cuando hay producto válido

            setTimeout(() => {
              if (this.cantidadInputEl?.nativeElement) {
                this.cantidadInputEl.nativeElement.focus();
                this.cantidadInputEl.nativeElement.select();
              }
            }, 0);
          } else {
            // No se encontró producto con ese código
            this.entrada.cantidad = 0;
            this.productoEncontrado = null;
            this.mensajeProducto = 'No se Encontró un Producto con ese Código. Intenta Nuevamente.';
            this.mostrarIconoNoEncontrado = true;

            setTimeout(() => {
              if (this.codigoInput?.nativeElement) {
                this.codigoInput.nativeElement.focus();
              }
            }, 0);
          }
        },
        error: (err: any) => {

          // Igualmente, si el código ya cambió, no hacer nada
          if (this.entrada.codigo !== codigoBuscado && this.entrada.codigo !== '') {
            return;
          }
          console.error('Error al Buscar Producto por Código', err);
          this.productoEncontrado = null;
          this.entrada.cantidad = 0;

          this.mensajeProducto = 'No se pudo Buscar el Producto. Intenta Nuevamente.';
          this.mostrarIconoNoEncontrado = false;

          setTimeout(() => {
            if (this.codigoInput?.nativeElement) {
              this.codigoInput.nativeElement.focus();
            }
          }, 0);
        }
      });
    }, 450); // esperar un momento desde la última tecla
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
        next: (productoActualizado: Producto) => {
          console.log('Stock Actualizado Correctamente:', productoActualizado);
          Swal.fire({
            icon: 'success',
            title: '¡Entrada Registrada!',
            html: `Se Agregaron <b>${cantidadEntrante} Unidades</b> al Producto`,
            showConfirmButton: false,
            timer: 2000
          });
          // Si el producto estaba inhabilitado y ahora tiene stock > 0, habilitarlo automáticamente
          const nuevoStock = Number(productoActualizado.stockProducto) || 0;
          if (productoActualizado.id && nuevoStock > 0 && productoActualizado.estado === false) {
            this.productoService.setEstado(productoActualizado.id, true).subscribe({
              next: (prodHabilitado) => {
                const idx = this.productos.findIndex(p => p.id === prodHabilitado.id);
                if (idx >= 0) {
                  this.productos[idx] = { ...this.productos[idx], ...prodHabilitado };
                }
              },
              error: () => {
                // En caso de error al habilitar, no interrumpir el flujo principal
              }
            });
          }
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
        error: (err: any) => {
          console.error('Error al Actualizar el Stock:', err);
          let mensajeError = 'No se pudo Actualizar el Inventario';
          
          if (err.error?.message) {
            mensajeError = err.error.message;
          } else if (err.status >= 500) {
            mensajeError = 'Error en el Servidor. Intente más Tarde.';
          } else if (err.status === 404) {
            mensajeError = 'Producto NO Encontrado';
          } else if (err.status === 400) {
            mensajeError = 'Datos Inválidos para Actualizar el Stock';
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
    // Inventario debe ver todos (incluye inhabilitados)
    this.productoService.getAll(true).subscribe({
      next: (data) => {
        this.productos = data || [];
        // Prefetch de flags canDelete para cada producto
        for (const prod of this.productos) {
          if (!prod?.id) continue;
          this.productoService.canDelete(prod.id).subscribe({
            next: (res) => { this.canDeleteMap[prod.id!] = !!res?.canDelete; },
            error: () => { this.canDeleteMap[prod.id!] = false; }
          });
        }
        // Asegurar que la página actual sea válida cuando cambie la data
        if (this.pageIndex > this.totalPages - 1) {
          this.pageIndex = 0;
        }
      },
      error: (err) => console.error('Error al Listar Productos', err)
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
  onNombreCategoriaChange(val: string): void {
    const nombre = String(val || '').trim().toLowerCase();
    if (!nombre) { this.nombreCategoriaDuplicado = false; return; }
    this.nombreCategoriaDuplicado = (this.categorias || []).some(c => String(c?.nombreCategoria || '').trim().toLowerCase() === nombre);
  }
  eliminarProducto(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción Eliminará el Producto.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService.delete(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', '<b>Producto</b> Eliminado Correctamente', 'success');
            this.onGuardado();
          },
          error: (err: any) => {
            // Priorizar mensaje del servidor (por ejemplo, FK violation: producto enlazado a una venta)
            let mensaje = err?.error?.message || 'Ocurrió un Error al Eliminar el Producto';
            if (!err?.error?.message) {
              if (err.status >= 500) mensaje = 'Error en el Servidor. Intente más Tarde.';
              else if (err.status === 404) mensaje = 'El Producto NO Éxiste o ya fue Eliminado.';
              else if (err.status === 400) mensaje = 'Solicitud Inválida.';
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
    const nombre = String(this.categoria?.nombreCategoria || '').trim();
    // Si el formulario es inválido o hay duplicado, marcar el control y no continuar
    if (!form.valid || this.nombreCategoriaDuplicado) {
      const ctrl = (form.controls as any)['nombreCategoria'];
      if (ctrl && typeof ctrl.control?.markAsTouched === 'function') {
        ctrl.control.markAsTouched();
      }
      return;
    }
    this.categoria.nombreCategoria = nombre;
    this.categoriaService.createCategorie(this.categoria).subscribe({
          next:()=>{
            Swal.fire({
              title: "Categoria Registrado!",
              icon: "success",
              html: `La Categoria <b>${this.categoria.nombreCategoria} </b> fue Registrada con Éxito`,
              draggable: true
            });
            this.categoria={
              nombreCategoria:'',
            }
            this.ngOnInit();
            form.resetForm(); 
          },
          error: (err: any) => {
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
        html: `Realmente Deseas Eliminar La <b>Categoria</b>?`,
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
                html: `<b>Categoria</b> Eliminada.`,
                icon: "success"
              })
              this.ngOnInit();
            },
            error: (err)=> {
              let mensaje = 'Ocurrió un error al eliminar el cliente';
              const fkViolation = err?.error?.code === '23503' ||
                                  (typeof err?.error?.detail === 'string' && err.error.detail.includes('referida')) ||
                                  (typeof err?.error?.detail === 'string' && err.error.detail.includes('productos'));
              if (fkViolation) {
                mensaje = 'No se puede Eliminar la Categoría porque está Ligada a Uno o Más Productos.';
              } else if (err.status >= 500) {
                mensaje = 'Error en el Servidor. Intente más Tarde.';
              } else if (err.status === 404) {
                mensaje = 'La Categoria NO existe o ya fue Eliminada.';
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
  abrirModal(cate: any): void {
    this.categoriaModificar = { ...cate };
    // Reset duplicate flag when opening modal
    this.nombreCategoriaModificarDuplicado = false;
  }

  onNombreCategoriaModificarChange(val: string): void {
    const nombre = String(val || '').trim().toLowerCase();
    if (!nombre) {
      this.nombreCategoriaModificarDuplicado = false;
      return;
    }
    const currentId = this.categoriaModificar?.idCategoria;
    this.nombreCategoriaModificarDuplicado = (this.categorias || []).some(c => {
      const sameName = String(c?.nombreCategoria || '').trim().toLowerCase() === nombre;
      const differentId = (c as any).idCategoria !== currentId;
      return sameName && differentId;
    });
  }

  modificarCategoria(id: number, categoriaModificar: { nombreCategoria: string }): void {
    const nombre = String(categoriaModificar?.nombreCategoria || '').trim();
    // Validación silenciosa: no enviar si vacío, corto o duplicado
    if (!nombre || nombre.length < 2 || this.nombreCategoriaModificarDuplicado) {
      return;
    }
    const payload = { nombreCategoria: nombre };
    this.categoriaService.updateCategorie(id, payload).subscribe({
      next: (respuesta) => {
        Swal.fire(
          "Categoria Modificada",
          `Se Actualizó <strong>${respuesta.nombreCategoria}</strong> Correctamente.`,
          "success"
        );
        this.ngOnInit();
      },
      error: (error) => {
        if (error.status === 404) {
          Swal.fire("No Encontrada", "La Categoria NO Existe (404).", "error");
        } else if (error.status === 500) {
          Swal.fire("Error del servidor", "Ocurrió un Error Interno (500). Intenta más Tarde.", "error");
        } else {
          Swal.fire("Error", `No se Pudo Modificar la Categoria. Código: ${error.status}` , "error");
        }
        console.error("Error al Modificar Caja:", error);
      }
    });
  }
}