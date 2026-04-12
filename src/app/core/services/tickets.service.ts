import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService, ApiResponse } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TicketsService {

  private readonly BASE = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  getTicketsPorGrupo(grupoId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.BASE}/grupos/${grupoId}/tickets`, { headers: this.headers() });
  }

  getTicket(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.BASE}/tickets/${id}`, { headers: this.headers() });
  }

  crearTicket(payload: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.BASE}/tickets`, payload, { headers: this.headers() });
  }

  editarTicket(id: string, campos: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.BASE}/tickets/${id}`, campos, { headers: this.headers() });
  }

  cambiarEstado(id: string, estado_id: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.BASE}/tickets/${id}/estado`, { estado_id }, { headers: this.headers() });
  }

  eliminarTicket(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.BASE}/tickets/${id}`, { headers: this.headers() });
  }

  agregarComentario(ticketId: string, contenido: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.BASE}/tickets/${ticketId}/comentarios`, { contenido }, { headers: this.headers() });
  }

  getHistorial(ticketId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.BASE}/tickets/${ticketId}/historial`, { headers: this.headers() });
  }
}