import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterPayload {
  username:         string;
  email:            string;
  password:         string;
  confirm_password: string;
  nombre_completo:  string;
  direccion:        string;
  telefono:         string;
  fecha_nacimiento: string;   // 'YYYY-MM-DD'
}

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface ApiResponse<T = any> {
  statusCode: number;
  intOpCode:  string;
  data:       T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly BASE = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // ── Register ────────────────────────────────────────────────────────────────
  register(payload: RegisterPayload): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.BASE}/register`, payload);
  }

  // ── Login ───────────────────────────────────────────────────────────────────
  login(payload: LoginPayload): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.BASE}/login`, payload);
  }

  // ── Token helpers ────────────────────────────────────────────────────────────
  saveToken(token: string): void {
    // Guardamos en cookie (HttpOnly no es posible desde JS,
    // pero lo dejamos accesible solo por path raíz)
    document.cookie = `erp_token=${token}; path=/; SameSite=Strict`;
  }

  getToken(): string | null {
    const match = document.cookie.match(/(?:^|;\s*)erp_token=([^;]*)/);
    return match ? match[1] : null;
  }

  clearToken(): void {
    document.cookie = 'erp_token=; path=/; max-age=0';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}