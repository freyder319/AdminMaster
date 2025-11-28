import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';

export interface Categorias{
  idCategoria:number;
  nombreCategoria:string;
}
@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  apiUrl = `${environment.apiUrl}/categoria`;
  constructor(private http:HttpClient) { }
  getCategories():Observable<Categorias[]>{
    return this.http.get<Categorias[]>(this.apiUrl);
  }
  getCategorie(id:number):Observable<Categorias>{
    return this.http.get<Categorias>(`${this.apiUrl}/${id}`);
  }
  createCategorie(categorie:Partial<Categorias>):Observable<Categorias>{
    return this.http.post<Categorias>(this.apiUrl,categorie);
  }
  updateCategorie(id:number,categoria:Partial<Categorias>): Observable<Categorias>{
    return this.http.put<Categorias>(`${this.apiUrl}/${id}`,categoria);
  }
  deleteCategorie(id:number):Observable<void>{
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
