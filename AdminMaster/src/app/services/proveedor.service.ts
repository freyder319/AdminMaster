import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Proveedor {
  id: number;
  nombre: string;
  apellido?: string;
  telefono: string;
  correo: string;
  activo: boolean;

  nombreEmpresa?: string;
  nit?: string;
  contactoNombre?: string;
}

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private readonly apiUrl = 'http://localhost:3000/proveedor';
  private readonly _proveedores$ = new BehaviorSubject<Proveedor[]>([]);

  readonly proveedores$ = this._proveedores$.asObservable();

  constructor(private http: HttpClient) {
    this.fetchAll().subscribe();
  }

  get snapshot(): Proveedor[] {
    return this._proveedores$.getValue();
  }

  fetchAll(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl).pipe(
      tap((list) => this._proveedores$.next(list))
    );
  }

  add(proveedor: Omit<Proveedor, 'id'>): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor).pipe(
      tap((nuevo) => this._proveedores$.next([nuevo, ...this.snapshot]))
    );
  }

  update(id: number, changes: Partial<Omit<Proveedor, 'id'>>): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, changes).pipe(
      tap((actualizado) =>
        this._proveedores$.next(
          this.snapshot.map((p) => (p.id === id ? { ...p, ...actualizado } : p))
        )
      )
    );
  }

  remove(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this._proveedores$.next(this.snapshot.filter((p) => p.id !== id)))
    );
  }
}
