import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, switchMap, map, startWith, distinctUntilChanged, shareReplay, fromEvent, filter, combineLatest } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../config/environment';

export interface AuditLogDto {
  id: number;
  timestamp: string;
  actorUserId: number | null;
  actorRol: string | null;
  module: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  route: string | null;
  ip: string | null;
  details: any;
}

export interface PagedAudit {
  items: AuditLogDto[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private api = `${environment.apiUrl}/audit`;
  private pollingMs = 10000;
  private lastTopId$ = new BehaviorSubject<number | null>(null);
  private sse$?: Observable<AuditLogDto>;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {}

  list(params: { page?: number; pageSize?: number; module?: string; action?: string; userId?: number; from?: string; to?: string; }): Observable<PagedAudit> {
    let p = new HttpParams();
    if (params.page) p = p.set('page', String(params.page));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    if (params.module) p = p.set('module', params.module);
    if (params.action) p = p.set('action', params.action);
    if (params.userId) p = p.set('userId', String(params.userId));
    if (params.from) p = p.set('from', params.from);
    if (params.to) p = p.set('to', params.to);
    return this.http.get<PagedAudit>(this.api, { params: p });
  }

  watchLatest(): Observable<AuditLogDto[]> {
    // Poll de la primera página para emular tiempo real sin SSE
    if (isPlatformBrowser(this.platformId)) {
      const visible$ = fromEvent(document, 'visibilitychange').pipe(
        startWith(0),
        map(() => !document.hidden)
      );
      const ticker$ = interval(this.pollingMs).pipe(startWith(0));
      return combineLatest([visible$, ticker$]).pipe(
        filter(([visible]) => visible),
        switchMap(() => this.list({ page: 1, pageSize: 20 })),
        map(res => res.items),
        distinctUntilChanged((a, b) => (a?.[0]?.id === b?.[0]?.id))
      );
    }
    // SSR fallback
    return interval(this.pollingMs).pipe(
      startWith(0),
      switchMap(() => this.list({ page: 1, pageSize: 20 })),
      map(res => res.items),
      distinctUntilChanged((a, b) => (a?.[0]?.id === b?.[0]?.id))
    );
  }

  connectSSE(): Observable<AuditLogDto> {
    if (!isPlatformBrowser(this.platformId)) {
      // SSR fallback: emite nada
      return new Observable<AuditLogDto>(() => {});
    }
    if (this.sse$) return this.sse$;
    this.sse$ = new Observable<AuditLogDto>((subscriber) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const url = new URL(this.api + '/stream');
      if (token) url.searchParams.set('token', token);
      const es = new EventSource(url.toString());
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as AuditLogDto;
          subscriber.next(data);
        } catch {}
      };
      es.onerror = () => {
        // Mantener conexión; EventSource reintenta automáticamente
      };
      return () => es.close();
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
    return this.sse$;
  }
}
