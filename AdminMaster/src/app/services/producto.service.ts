import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
}
