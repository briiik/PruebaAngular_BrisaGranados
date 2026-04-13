import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PermissionService } from '../../core/services/permission.service';

export interface Usuario {
  id:                string;
  nombre_completo:   string;
  username:          string;
  email:             string;
  direccion:         string;
  telefono:          string;
  fecha_inicio:      string;
  fecha_nacimiento:  string | null;
  last_login:        string | null;
  permisos_globales: string[];   // UUIDs de permisos
  creado_en:         string;
  permisosNombres:   string[];   // nombres legibles ['ticket:view', 'superadmin', ...]
}

export interface Permiso {
  id:          string;
  nombre:      string;
  descripcion: string;
}

@Injectable({ providedIn: 'root' })
export class SharedDataService {

  constructor(private permissionService: PermissionService) {}

  private supabase: SupabaseClient = createClient(
    'https://dgmgngfrespeheuzrpso.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbWduZ2ZyZXNwZWhldXpycHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDk2MzMsImV4cCI6MjA4OTg4NTYzM30.fUqQzetG3ZREKVTPQNmv2BzjwFoL3No5gf8qk-0rKuQ',
    {
      auth: {
        lock: async (name, acquireTimeout, fn) => fn()  // evita navigator.locks
      }
    }
  );

  usuarioActual: Usuario | null = null;
  todosLosPermisos: Permiso[]   = [];

  // Para saber si ya terminó de inicializar (útil en el guard)
  private _listo = false;
  private _inicializando: Promise<void> | null = null;

  // ── Punto de entrada único ─────────────────────────────────────────────────
  // Llama esto una sola vez (AppComponent.ngOnInit).
  // Si se llama más de una vez, devuelve la misma Promise.
  inicializar(): Promise<void> {
    if (this._inicializando) return this._inicializando;
    this._inicializando = this._doInicializar();
    return this._inicializando;
  }

  private async _doInicializar(): Promise<void> {
  // Siempre recargar el catálogo fresco al inicializar
    await this.cargarCatalogoPermisos(true);

    const raw = localStorage.getItem('erp_usuario');
    if (!raw) { this._listo = true; return; }

    let base: { id: string };
    try { base = JSON.parse(raw); } catch { this._listo = true; return; }

    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('id', base.id)
      .single();

    if (!error && data) {
      this.usuarioActual = {
        ...data,
        permisosNombres: this._resolverNombres(data.permisos_globales ?? []),
      };
      // ← Sincronizar con PermissionService
      this.permissionService.setPermisosGlobales(
        this.usuarioActual?.permisosNombres ?? []
      );
    }

    this._listo = true;
  }

  // Espera a que inicializar() haya terminado (lo usa el guard)
  esperarListo(): Promise<void> {
    if (this._listo) return Promise.resolve();
    // Si todavía no arrancó (raro), arranca ahora
    return this.inicializar();
  }

    async cargarCatalogoPermisos(forzar = false): Promise<void> {
      // ✅ Acepta parámetro para saltarse el cache
      if (!forzar && this.todosLosPermisos.length > 0) return;
      const { data } = await this.supabase.from('permisos').select('*');
      this.todosLosPermisos = data ?? [];
    }

  private _resolverNombres(uuids: string[]): string[] {
    return this.todosLosPermisos
      .filter(p => uuids.includes(p.id))
      .map(p => p.nombre);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  tienePerm(nombre: string): boolean {
  console.log('usuarioActual:', this.usuarioActual);
  console.log('permisosNombres:', this.usuarioActual?.permisosNombres);
  return this.usuarioActual?.permisosNombres?.includes(nombre) ?? false;
}

  get usuarioActivoNombre(): string {
    return this.usuarioActual?.nombre_completo ?? '';
  }

  get db(): SupabaseClient {
    return this.supabase;
  }

  // Resetea para forzar reinicialización en el próximo inicializar()
  reset(): void {
    this._listo        = false;
    this._inicializando = null;
    this.usuarioActual  = null;
    this.todosLosPermisos = [];
  }
}