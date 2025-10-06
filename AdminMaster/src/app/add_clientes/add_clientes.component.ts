import { HttpClient } from '@angular/common/http';
import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ClientesService } from '../services/clientes.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-add-clientes',
  imports: [FormsModule, CommonModule],
  templateUrl: './add_clientes.component.html',
  styleUrl: './add_clientes.component.scss'
})
export class AddClientesComponent {
  errorMessage: string = ''; 
  correoInvalido: boolean = false;
  clienteExcede: boolean = false;
  clienteNoNumerico: boolean = false;
  @Output() clienteAgregado = new EventEmitter();
  cliente={
    nombre:'',
    apellido:'',
    numero:'',
    correo:'',
    estado:'',
  }
  constructor(private clientesServices:ClientesService){}
  agregarCliente(form: NgForm){
    if(this.cliente.estado==''){
      Swal.fire("Estado Requerido", "Por Favor Selecciona si el cliente está Activo o Inactivo.", "warning");
    }else{
          this.clientesServices.createCliente(this.cliente).subscribe({
      next:()=>{
        Swal.fire({
          title: "Cliente Registrado!",
          icon: "success",
          html: `El cliente <b>${this.cliente.nombre} ${this.cliente.apellido}</b> fue registrado con éxito`,
          draggable: true
        });
        this.cliente={
          nombre:'',
          apellido:'',
          numero:'',
          correo:'',
          estado:'',
        }
        form.resetForm(); 
        this.clienteAgregado.emit();  
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
  }
  cambiarEstado(nuevoEstado: 'activo' | 'inactivo') {
    if(this.cliente){
      this.cliente.estado = nuevoEstado;
    }else{
      console.log("Error de estado")
    }
  }
  validarcliente() {
    const valor = this.cliente.numero || '';

    this.clienteExcede = valor.length > 10;
    this.clienteNoNumerico = !/^\d*$/.test(valor);

    if (valor.length > 20) {
      this.cliente.numero = valor.slice(0, 20);
    }
  }
  validarCorreo() {
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.correoInvalido = this.cliente.correo 
      ? !regexCorreo.test(this.cliente.correo) 
      : false;
  }
}
