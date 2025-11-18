import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Producto {
  id?: number;
  codigoProducto: string;
  imgProducto?: string | null;
  nombreProducto: string;
  stockProducto: number;
  precioUnitario: number;
  precioComercial: number;
  idCategoria?: number;
  categoria?: any;
  estado?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl='http://localhost:3000/producto'
  constructor(private http: HttpClient) { }
  getCount():Observable<{total:number}>{
    return this.http.get<{total:number}>(`${this.apiUrl}/count`);
  }
  getTotalMoney():Observable<{total:number}>{
    return this.http.get<{total:number}>(`${this.apiUrl}/totalMoney`);
  }
  // Listar productos (por defecto solo habilitados). Usar all=true para inventario.
  getAll(all: boolean = false): Observable<Producto[]> {
    const qs = all ? '?all=true' : '';
    return this.http.get<Producto[]>(`${this.apiUrl}${qs}`);
  }
  // Listar productos publicos
  getPublic(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/public`);
  }
  // Obtener un producto por ID
  get(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }
  // Crear producto
  create(data: Partial<Producto>): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}`, data);
  }
  // Actualizar producto
  update(id: number, data: Partial<Producto>): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, data);
  }
  // Habilitar / Inhabilitar
  setEstado(id: number, estado: boolean): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}/estado`, { estado });
  }
  // Eliminar producto
  delete(id: number): Observable<{deleted:boolean} | void> {
    return this.http.delete<{deleted:boolean} | void>(`${this.apiUrl}/${id}`);
  }

  // Saber si se puede eliminar (sin ventas asociadas)
  canDelete(id: number): Observable<{ canDelete: boolean }> {
    return this.http.get<{ canDelete: boolean }>(`${this.apiUrl}/${id}/can-delete`);
  }
  // Buscar producto por código
  buscarPorCodigo(codigo: string): Observable<Producto | null> {
    return this.http.get<Producto | null>(`${this.apiUrl}/buscar/${codigo}`);
  }

  // Actualizar el stock de un producto
  actualizarStock(id: number, nuevaCantidad: number): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}/stock`, { stock: nuevaCantidad });
  }
}
