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
        numero: this.cliente.numero,
        correo: this.cliente.correo,
        estado: this.cliente.estado,
      };
      this.clienteServices.updateCliente(this.clienteId,dto).subscribe({
        next:()=>{
          Swal.fire({
          title: "Cliente Modificado!",
          icon: "success",
          html: `El cliente fue Modificado con éxito`,
          draggable: true
          },);
          this.clienteModificado.emit();  
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
      });
    }else{
      console.log("Error al cargar el cliente")
    }
  }
  cambiarEstado(nuevoEstado: 'activo' | 'inactivo') {
    if(this.cliente){
      this.cliente.estado = nuevoEstado;
    }else{
      console.log("Error de estado")
    }
  }
}