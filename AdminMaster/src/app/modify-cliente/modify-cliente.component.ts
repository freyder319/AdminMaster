import { Component, Input, Output,EventEmitter } from '@angular/core';
import { Clientes, ClientesService } from '../services/clientes.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modify-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modify-cliente.component.html',
  styleUrl: './modify-cliente.component.scss'
})
export class ModifyClienteComponent {
  errorMessage: string = ''; 
  @Output() clienteModificado = new EventEmitter();
  cliente: Clientes | null = null;
  constructor(private clienteServices:ClientesService){}
  @Input() clienteId: number | null = null;
    ngOnInit() {
    if(this.clienteId===null){
    }else{
      this.clienteServices.getCliente(this.clienteId).subscribe({
        next:(data)=>this.cliente=data,
        error: ()=> "error"
      })
    }
  }
  modificarCliente(){
    if(this.clienteId && this.cliente){
      const dto = {
        nombre: this.cliente.nombre,
        apellido: this.cliente.apellido,
        documento: (this.cliente as any).documento,
        numero: this.cliente.numero,
        correo: this.cliente.correo,
        estado: this.cliente.estado,
      };
      this.clienteServices.updateCliente(this.clienteId,dto).subscribe({
        next:()=>{
          Swal.fire({
          title: "Cliente Modificado!",
          icon: "success",
          html: `El <b>Cliente</b> fue Modificado con Éxito`,
          timer: 2000,
          showConfirmButton: false
          },);
          this.clienteModificado.emit();  
          },
        error: (err) => {
          if (err.status === 400) {
            this.errorMessage = err.error.message;
          } else {
            this.errorMessage = 'Ocurrió un error inesperado';
          }
          Swal.fire({
            title: "Error",
            icon: "error",
            text: this.errorMessage,
          });
        }
      });
    }else{
    }
  }
  cambiarEstado(nuevoEstado: 'activo' | 'inactivo') {
    if(this.cliente){
      this.cliente.estado = nuevoEstado;
    }
  }
}