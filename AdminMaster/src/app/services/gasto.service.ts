import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';

export type FormaPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'nequi' | 'daviplata' | 'otros';
export type EstadoGasto = 'confirmado' | 'pendiente' | 'anulado';

export interface Gasto {
  id: number;
  fecha: string; // YYYY-MM-DD
  monto: string; // usar string para precisión
  nombre?: string;
  descripcion?: string;
  categoriaId?: number;
  proveedorId?: number;
  forma_pago: FormaPago;
  usuarioId?: number;
  turnoId?: number | null;
  estado: EstadoGasto;
  transaccionId?: string | null;
}

export type CreateGasto = Omit<Gasto, 'id'>;

@Injectable({ providedIn: 'root' })
export class GastoService {
  private readonly apiUrl = 'http://localhost:3000/gasto';
  private readonly _gastos$ = new BehaviorSubject<Gasto[]>([]);
  readonly gastos$ = this._gastos$.asObservable();
  private readonly _refresh$ = new Subject<void>();
  readonly refresh$ = this._refresh$.asObservable();

  constructor(private http: HttpClient) {}

  private authOptions() {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
        }
      }
    } catch {}
    return {};
  }

  get snapshot(): Gasto[] {
    return this._gastos$.getValue();
    }

  fetchAll(): Observable<Gasto[]> {
    return this.http.get<Gasto[]>(this.apiUrl, this.authOptions()).pipe(
      tap((list) => this._gastos$.next(list))
    );
  }

  getById(id: number): Observable<Gasto> {
    return this.http.get<Gasto>(`${this.apiUrl}/${id}`, this.authOptions());
  }

  create(data: CreateGasto): Observable<Gasto> {
    return this.http.post<Gasto>(this.apiUrl, data, this.authOptions()).pipe(
      tap((nuevo) => {
        this._gastos$.next([nuevo, ...this.snapshot]);
        this._refresh$.next();
      })
    );
  }

  update(id: number, changes: Partial<CreateGasto>): Observable<Gasto> {
    return this.http.put<Gasto>(`${this.apiUrl}/${id}`, changes, this.authOptions()).pipe(
      tap((updated) =>
        this._gastos$.next(
          this.snapshot.map((g) => (g.id === id ? { ...g, ...updated } as Gasto : g))
        )
      )
    );
  }

  remove(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.authOptions()).pipe(
      tap(() => this._gastos$.next(this.snapshot.filter((g) => g.id !== id)))
    );
  }
}
