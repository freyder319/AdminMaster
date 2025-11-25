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
  correoDuplicado: boolean = false;
  telefonoDuplicado: boolean = false;
  documentoDuplicado: boolean = false;
  documentoNoNumerico: boolean = false;
  documentoLongitudInvalida: boolean = false;
  @Output() clienteAgregado = new EventEmitter();
  cliente={
    nombre:'',
    apellido:'',
    documento:'',
    numero:'',
    correo:'',
    estado:'activo',
  }
  validarDocumento() {
    const doc = this.cliente.documento || '';

    // Solo números
    const soloNumeros = /^\d*$/.test(doc);
    this.documentoNoNumerico = !soloNumeros;

    // Longitud fija de 10 dígitos (si se escribió algo)
    this.documentoLongitudInvalida = !!doc && doc.length !== 10;

    // Si formato es inválido, no llamar al backend
    if (this.documentoNoNumerico || this.documentoLongitudInvalida) {
      this.documentoDuplicado = false;
      return;
    }

    const correo = this.cliente.correo || '';
    const numero = this.cliente.numero || '';
    const documento = this.cliente.documento || '';
    if (correo || numero || documento) {
      this.clientesServices.verificarExistencia(correo, numero, documento).subscribe({
        next: (existe) => {
          this.correoDuplicado = !!correo && !!existe.correo;
          this.telefonoDuplicado = !!numero && !!existe.numero;
          this.documentoDuplicado = !!documento && !!existe.documento;
        },
        error: () => {
          this.correoDuplicado = false;
          this.telefonoDuplicado = false;
          this.documentoDuplicado = false;
        }
      });
    }
  }
  constructor(private clientesServices:ClientesService){}
  agregarCliente(form: NgForm){
    if(this.cliente.estado==''){
      Swal.fire({
        title: "Estado Requerido",
        icon: "warning",
        html: "Por favor Selecciona si el <b>Cliente</b> está Activo o Inactivo.",
      });
    }else{
      this.clientesServices.createCliente(this.cliente).subscribe({
      next:()=>{
        Swal.fire({
          title: "Cliente Registrado!",
          icon: "success",
          html: `El Cliente <b>${this.cliente.nombre} ${this.cliente.apellido}</b> fue Registrado con Éxito`,
          timer: 2000,
          showConfirmButton: false
        });
        this.cliente={
          nombre:'',
          apellido:'',
          documento:'',
          numero:'',
          correo:'',
          estado:'activo',
        }
        form.resetForm(); 
        this.clienteAgregado.emit();  
      },
      error: (err) => {
        console.log(err)
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

    // Solo números
    const soloNumeros = /^\d*$/.test(valor);
    this.clienteNoNumerico = !soloNumeros;

    // Máximo 10 dígitos
    this.clienteExcede = valor.length > 10;

    // Si pasa validaciones básicas, verificar duplicados (teléfono/correo/documento)
    if (!this.clienteNoNumerico && !this.clienteExcede) {
      const correo = this.cliente.correo || '';
      const numero = this.cliente.numero || '';
      const documento = this.cliente.documento || '';
      if (correo || numero || documento) {
        this.clientesServices.verificarExistencia(correo, numero, documento).subscribe({
          next: (existe) => {
            this.correoDuplicado = !!correo && !!existe.correo;
            this.telefonoDuplicado = !!numero && !!existe.numero;
            this.documentoDuplicado = !!documento && !!existe.documento;
          },
          error: () => {
            // Si falla la validación en backend, no bloquear por duplicados
            this.correoDuplicado = false;
            this.telefonoDuplicado = false;
            this.documentoDuplicado = false;
          }
        });
      }
    }
  }
  validarCorreo() {
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.correoInvalido = this.cliente.correo 
      ? !regexCorreo.test(this.cliente.correo) 
      : false;

    // Si el formato es válido, verificar duplicados en backend
    if (!this.correoInvalido) {
      const correo = this.cliente.correo || '';
      const numero = this.cliente.numero || '';
      const documento = this.cliente.documento || '';
      if (correo || numero || documento) {
        this.clientesServices.verificarExistencia(correo, numero, documento).subscribe({
          next: (existe) => {
            this.correoDuplicado = !!correo && !!existe.correo;
            this.telefonoDuplicado = !!numero && !!existe.numero;
            this.documentoDuplicado = !!documento && !!existe.documento;
          },
          error: () => {
            this.correoDuplicado = false;
            this.telefonoDuplicado = false;
            this.documentoDuplicado = false;
          }
        });
      }
    }
  }

  onEnterFocus(next: any, event: Event, value?: any) {
    event.preventDefault();

    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === 'string' && !value.trim()) {
      return;
    }
    if (typeof value === 'number' && (!Number.isFinite(value) || value <= 0)) {
      return;
    }

    if (next && typeof next.focus === 'function') {
      next.focus();
      if (typeof next.select === 'function') {
        next.select();
      }
    }
  }
}
