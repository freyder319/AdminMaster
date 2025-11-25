import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

export interface DescuentoDto {
  id: number;
  nombre: string;
  porcentaje: number;
  creadoEn: string | number; // backend puede devolver bigint como string
  tipo?: 'PORCENTAJE' | 'VALOR_FIJO';
  fechaInicio?: string | null;
  fechaFin?: string | null;
  activo?: boolean;
}

export interface Descuento {
  id: number;
  nombre: string;
  porcentaje: number;
  creadoEn: number; // epoch ms para usar con date pipe
  tipo: 'PORCENTAJE' | 'VALOR_FIJO';
  fechaInicio?: number | null;
  fechaFin?: number | null;
  activo: boolean;
}

export type CreateDescuento = Omit<Descuento, 'id'>;

@Injectable({ providedIn: 'root' })
export class DescuentoService {
  private readonly apiUrl = 'http://localhost:3000/descuento';
  private readonly _items$ = new BehaviorSubject<Descuento[]>([]);
  readonly items$ = this._items$.asObservable();

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

  private toViewModel(dto: DescuentoDto): Descuento {
    return {
      id: dto.id,
      nombre: dto.nombre,
      porcentaje: dto.porcentaje,
      creadoEn: typeof dto.creadoEn === 'string' ? Number(dto.creadoEn) : dto.creadoEn,
      tipo: dto.tipo || 'PORCENTAJE',
      fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio).getTime() : null,
      fechaFin: dto.fechaFin ? new Date(dto.fechaFin).getTime() : null,
      activo: typeof dto.activo === 'boolean' ? dto.activo : true,
    };
  }

  get snapshot(): Descuento[] {
    return this._items$.getValue();
  }

  fetchAll(): Observable<Descuento[]> {
    return this.http.get<DescuentoDto[]>(this.apiUrl, this.authOptions()).pipe(
      map((list) => list.map((d) => this.toViewModel(d))),
      tap((list) => this._items$.next(list))
    );
  }

  getById(id: number): Observable<Descuento> {
    return this.http
      .get<DescuentoDto>(`${this.apiUrl}/${id}`, this.authOptions())
      .pipe(map((dto) => this.toViewModel(dto)));
  }

  create(data: CreateDescuento): Observable<Descuento> {
    return this.http
      .post<DescuentoDto>(this.apiUrl, data, this.authOptions())
      .pipe(
        map((dto) => this.toViewModel(dto)),
        tap((nuevo) => this._items$.next([nuevo, ...this.snapshot]))
      );
  }

  update(id: number, changes: Partial<CreateDescuento>): Observable<Descuento> {
    return this.http
      .put<DescuentoDto>(`${this.apiUrl}/${id}`, changes, this.authOptions())
      .pipe(
        map((dto) => this.toViewModel(dto)),
        tap((updated) =>
          this._items$.next(
            this.snapshot.map((g) => (g.id === id ? { ...g, ...updated } : g))
          )
        )
      );
  }

  remove(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.authOptions()).pipe(
      tap(() => this._items$.next(this.snapshot.filter((g) => g.id !== id)))
    );
  }
}
