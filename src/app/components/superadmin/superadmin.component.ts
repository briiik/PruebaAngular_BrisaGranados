import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

import { TableModule }         from 'primeng/table';
import { ButtonModule }        from 'primeng/button';
import { InputTextModule }     from 'primeng/inputtext';
import { DialogModule }        from 'primeng/dialog';
import { TagModule }           from 'primeng/tag';
import { AvatarModule }        from 'primeng/avatar';
import { ToastModule }         from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule }       from 'primeng/tooltip';
import { DividerModule }       from 'primeng/divider';
import { SelectModule }        from 'primeng/select';
import { ToolbarModule }       from 'primeng/toolbar';
import { CardModule }          from 'primeng/card';
import { MessageModule }       from 'primeng/message';
import { BreadcrumbModule }    from 'primeng/breadcrumb';
import { CheckboxModule }      from 'primeng/checkbox';
import { PasswordModule }      from 'primeng/password';
import { ToggleButtonModule }  from 'primeng/togglebutton';
import { BadgeModule }         from 'primeng/badge';
import { PermNombrePipe } from '../shared/perm-nombre.pipe';

import { SharedDataService, Usuario, Permiso } from '../shared/shared-data.service';

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, InputTextModule, DialogModule,
    TagModule, AvatarModule, ToastModule, ConfirmDialogModule,
    TooltipModule, DividerModule, SelectModule, ToolbarModule,
    CardModule, MessageModule, BreadcrumbModule, CheckboxModule,
    PasswordModule, ToggleButtonModule, BadgeModule, PermNombrePipe,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './superadmin.component.html',
})
export class SuperadminComponent implements OnInit {

  breadcrumbItems = [{ label: 'Superadmin' }];
  breadcrumbHome  = { icon: 'pi pi-home', routerLink: '/' };

  avatarColors = ['#C9A84C','#10B981','#3B82F6','#EF4444','#8B5CF6','#EC4899','#06B6D4'];

  cargando = true;

  // Lista de usuarios editables (todos excepto el superadmin actual)
  usuarios:          Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];

  filtroEstado   = '';
  filtroBusqueda = '';
  estadoOptions  = [
    { label: 'Activos',   value: 'activo' },
    { label: 'Inactivos', value: 'inactivo' },
  ];

  expandedRows: { [key: string]: boolean } = {};

  // Permisos editables = todos excepto 'superadmin'
  permisosEditables: Permiso[] = [];

  // Modal permisos
  modalPermisosVisible    = false;
  usuarioEditandoPermisos: Usuario | null = null;
  permisosEditando: string[] = [];  // UUIDs seleccionados

  constructor(
    public shared:  SharedDataService,
    private router: Router,
    private msg:    MessageService,
    private confirm: ConfirmationService,
  ) {}

  async ngOnInit() {
    if (!this.tieneAcceso()) {
      this.router.navigate(['/acceso-denegado']);
      return;
    }
    await this.shared.cargarCatalogoPermisos();
    // Permisos que el superadmin puede asignar a otros (excluye superadmin)
    this.permisosEditables = this.shared.todosLosPermisos.filter(p => p.nombre !== 'superadmin');
    await this.cargarUsuarios();
    this.cargando = false;
  }

  tieneAcceso(): boolean {
    return this.shared.tienePerm('superadmin');
  }

  // ── Cargar usuarios desde Supabase (todos menos el superadmin actual) ──────
  async cargarUsuarios() {
    const { data, error } = await this.shared.db
      .from('usuarios')
      .select('*')
      .neq('id', this.shared.usuarioActual!.id)
      .order('creado_en', { ascending: true });

    if (error) {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios.' });
      return;
    }

    this.usuarios = (data ?? []).map(u => ({
      ...u,
      permisosNombres: this.resolverNombres(u.permisos_globales ?? []),
    }));
    this.aplicarFiltros();
  }

  private resolverNombres(uuids: string[]): string[] {
    return this.shared.todosLosPermisos
      .filter(p => uuids.includes(p.id))
      .map(p => p.nombre);
  }

  // ── Métricas ───────────────────────────────────────────────────────────────
  // (se calculan sobre todos los usuarios, incluyendo el superadmin)
  get totalUsuarios()   { return this.usuarios.length + 1; }
  get totalActivos()    { return this.usuarios.filter(u => u.last_login).length + 1; }

  // ── Filtros ────────────────────────────────────────────────────────────────
  aplicarFiltros() {
    this.usuariosFiltrados = this.usuarios.filter(u => {
      const matchEstado =
        !this.filtroEstado ||
        (this.filtroEstado === 'activo'   &&  u.last_login) ||
        (this.filtroEstado === 'inactivo' && !u.last_login);
      const q = this.filtroBusqueda.toLowerCase();
      const matchBusqueda =
        !q ||
        u.nombre_completo.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      return matchEstado && matchBusqueda;
    });
  }

  // ── Expand ─────────────────────────────────────────────────────────────────
  toggleExpand(u: Usuario) {
    if (this.expandedRows[u.id]) delete this.expandedRows[u.id];
    else this.expandedRows = { ...this.expandedRows, [u.id]: true };
  }

  getAvatarColor(id: string): string {
    const n = parseInt(id.replace(/-/g, '').slice(0, 8), 16);
    return this.avatarColors[n % this.avatarColors.length];
  }

  // ── Modal permisos ─────────────────────────────────────────────────────────
  abrirModalPermisos(u: Usuario) {
    this.usuarioEditandoPermisos = u;
    // Solo los UUIDs de permisos editables (no superadmin)
    this.permisosEditando = (u.permisos_globales ?? []).filter(uuid =>
      this.permisosEditables.some(p => p.id === uuid)
    );
    this.modalPermisosVisible = true;
  }

  togglePermiso(uuid: string, activo: boolean) {
    this.permisosEditando = activo
      ? [...new Set([...this.permisosEditando, uuid])]
      : this.permisosEditando.filter(p => p !== uuid);
  }

  seleccionarTodos() { this.permisosEditando = this.permisosEditables.map(p => p.id); }
  limpiarTodos()     { this.permisosEditando = []; }

  async guardarPermisos() {
    if (!this.usuarioEditandoPermisos) return;

    // Mantener permisos que no son editables (ej. si el usuario tuviera 'superadmin')
    const permisosNoEditables = (this.usuarioEditandoPermisos.permisos_globales ?? []).filter(
      uuid => !this.permisosEditables.some(p => p.id === uuid)
    );
    const nuevosPermisos = [...permisosNoEditables, ...this.permisosEditando];

    const { error } = await this.shared.db
      .from('usuarios')
      .update({ permisos_globales: nuevosPermisos })
      .eq('id', this.usuarioEditandoPermisos.id);

    if (error) {
      this.msg.add({ severity: 'error', summary: 'Error', detail: error.message });
      return;
    }

    // Actualizar en memoria
    const idx = this.usuarios.findIndex(u => u.id === this.usuarioEditandoPermisos!.id);
    if (idx !== -1) {
      this.usuarios[idx].permisos_globales = nuevosPermisos;
      this.usuarios[idx].permisosNombres   = this.resolverNombres(nuevosPermisos);
    }

    this.msg.add({ severity: 'success', summary: 'Guardado', detail: `Permisos de ${this.usuarioEditandoPermisos.nombre_completo} actualizados.` });
    this.aplicarFiltros();
    this.modalPermisosVisible = false;
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────
  confirmarEliminar(u: Usuario) {
    this.confirm.confirm({
      message:  `¿Eliminar a <b>${u.nombre_completo}</b>? Esta acción no se puede deshacer.`,
      header:   'Confirmar eliminación',
      icon:     'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        const { error } = await this.shared.db
          .from('usuarios')
          .delete()
          .eq('id', u.id);
        if (error) {
          this.msg.add({ severity: 'error', summary: 'Error', detail: error.message });
          return;
        }
        this.usuarios = this.usuarios.filter(x => x.id !== u.id);
        this.aplicarFiltros();
        this.msg.add({ severity: 'warn', summary: 'Eliminado', detail: `${u.nombre_completo} eliminado.` });
      },
    });
  }

  volver() { this.router.navigate(['/grupo']); }
}