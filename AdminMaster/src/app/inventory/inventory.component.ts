import { Component, ViewChild } from '@angular/core';
import { AdminNavbarComponent } from "../admin_navbar/admin_navbar.component";
import { CreateProductoComponent } from "../create_producto/create_producto.component";
import { FormGroup, FormsModule, NgForm } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ProductoService } from '../services/producto.service';
import { Categorias, CategoriaService } from '../services/categoria.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

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
  pageSize = 10;       // cuantos mostrar por página
  pageIndex = 0;       // página actual
  categorias:Categorias[] = [];
  categoria:any={
    nombreCategoria:''
  }
  categoriaModificar: any = {
    idCategoria: null,
    nombreCategoria: ''
  };
  categoriaSeleccionada?: Categorias;
  modificarActivo=false;
  constructor(
    private productoService:ProductoService,
    private categoriaService:CategoriaService
  ){}
  ngOnInit():void{
    this.cargarTotal();
  }
  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    console.log('Página actual:', this.pageIndex, ' | Tamaño:', this.pageSize);
  }
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
  agregarCategoria(form:NgForm){
    this.categoriaService.createCategorie(this.categoria).subscribe({
          next:()=>{
            Swal.fire({
              title: "Cliente Registrado!",
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
}