import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService, ApiResponse } from './auth.service';

@Injectable({ providedIn: 'root' })
export class GruposService {

  private readonly BASE = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  getMisGrupos(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.BASE}/grupos`, { headers: this.headers() });
  }

  getGrupo(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.BASE}/grupos/${id}`, { headers: this.headers() });
  }

  getMiembros(grupoId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.BASE}/grupos/${grupoId}/miembros`, { headers: this.headers() });
  }

  getPermisos(grupoId: string, usuarioId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.BASE}/grupos/${grupoId}/permisos/${usuarioId}`, { headers: this.headers() });
  }

  crearGrupo(nombre: string, descripcion: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.BASE}/grupos`, { nombre, descripcion }, { headers: this.headers() });
  }

    editarGrupo(id: string, nombre: string, descripcion: string): Observable<ApiResponse> {
        return this.http.patch<ApiResponse>(
            `${this.BASE}/grupos/${id}`,
            { nombre, descripcion },
            { headers: this.headers() }
        );
    }

    eliminarGrupo(id: string): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(
            `${this.BASE}/grupos/${id}`,
            { headers: this.headers() }
        );
    }

// Actualizar agregarMiembro para enviar permisos
agregarMiembro(grupoId: string, usuarioId: string, permisos_ids: string[] = []): Observable<ApiResponse> {
  return this.http.post<ApiResponse>(
    `${this.BASE}/grupos/${grupoId}/miembros`,
    { usuario_id: usuarioId, permisos_ids },
    { headers: this.headers() }
  );
}

getCatalogoPermisos(): Observable<ApiResponse> {
  return this.http.get<ApiResponse>(
    `http://localhost:3000/api/permisos`,
    { headers: this.headers() }
  );
}

    asignarPermiso(grupoId: string, usuarioId: string, permisoId: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
        `${this.BASE}/grupos/${grupoId}/permisos`,
        { usuario_id: usuarioId, permiso_id: permisoId },
        { headers: this.headers() }
    );
    }
  
    actualizarPermisosMiembro(grupoId: string, usuarioId: string, permisos_ids: string[]): Observable<ApiResponse> {
  return this.http.put<ApiResponse>(
    `${this.BASE}/grupos/${grupoId}/miembros/${usuarioId}/permisos`,
    { permisos_ids },
    { headers: this.headers() }
  );
}

eliminarMiembro(grupoId: string, usuarioId: string): Observable<ApiResponse> {
  return this.http.delete<ApiResponse>(
    `${this.BASE}/grupos/${grupoId}/miembros/${usuarioId}`,
    { headers: this.headers() }
  );
}

    quitarPermiso(grupoId: string, usuarioId: string, permisoId: string): Observable<ApiResponse> {
  return this.http.delete<ApiResponse>(
    `${this.BASE}/grupos/${grupoId}/permisos`,
    { headers: this.headers(), body: { usuario_id: usuarioId, permiso_id: permisoId } }
  );
}
}