import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {

  private readonly BASE = 'http://localhost:3000/api';

  // Caché: { "grupoId": ["group:view", "ticket:create", ...] }
  private permisosGrupo: Record<string, string[]> = {};
  // Permisos globales del usuario
  private permisosGlobales: string[] = [];

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  // ── Inicializar con permisos globales del usuario ───────────────────────────
  setPermisosGlobales(nombres: string[]): void {
    this.permisosGlobales = nombres;
  }

  // ── Cargar permisos de un grupo específico ──────────────────────────────────
  refreshPermissionsForGroup(groupId: string): Promise<void> {
    return new Promise((resolve) => {
      const raw = localStorage.getItem('erp_usuario');
      if (!raw) { resolve(); return; }
      const usuario = JSON.parse(raw);

      this.http.get<any>(
        `${this.BASE}/grupos/${groupId}/permisos/${usuario.id}`,
        { headers: this.headers() }
      ).subscribe({
        next: (res) => {
          this.permisosGrupo[groupId] = (res.data ?? []).map((p: any) => p.nombre);
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  // ── Verificar permiso ───────────────────────────────────────────────────────
  // Verifica globales primero, luego de grupo si se pasa groupId
  hasPermission(permission: string, groupId?: string): boolean {
    // Si no hay globales cargados, intentar recuperarlos
    if (this.permisosGlobales.length === 0) {
      const raw = localStorage.getItem('erp_usuario');
      // No hacer nada aquí, solo verificar permisos de grupo
    }

    if (this.permisosGlobales.includes('superadmin')) return true;
    if (this.permisosGlobales.includes(permission)) return true;
    if (groupId && this.permisosGrupo[groupId]?.includes(permission)) return true;
    return false;
  }

  // ── Limpiar caché al cerrar sesión ──────────────────────────────────────────
  clear(): void {
    this.permisosGrupo   = {};
    this.permisosGlobales = [];
  }

  // ── Getter para permisos de grupo (usado por la directiva) ──────────────────
  getPermisosGrupo(groupId: string): string[] {
    return this.permisosGrupo[groupId] ?? [];
  }
}