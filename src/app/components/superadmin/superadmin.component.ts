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
import { TabsModule }          from 'primeng/tabs';
import { AccordionModule }     from 'primeng/accordion';
import { SkeletonModule }      from 'primeng/skeleton';
import { DatePickerModule }    from 'primeng/datepicker';

import { SharedDataService, Usuario, Permiso } from '../shared/shared-data.service';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';

// Categorías de permisos
const PERMISOS_GLOBALES  = ['superadmin', 'group:create'];
const PERMISOS_GRUPO     = ['group:view', 'group:edit', 'group:delete', 'group:add', 'group:manage'];
const PERMISOS_TICKETS   = ['ticket:create', 'ticket:view', 'ticket:viewall', 'ticket:edit', 'ticket:delete', 'ticket:assign'];

interface GrupoConPermisos {
  id:     string;
  nombre: string;
  permisosActuales: string[]; // UUIDs
}

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, InputTextModule, DialogModule,
    TagModule, AvatarModule, ToastModule, ConfirmDialogModule,
    TooltipModule, DividerModule, SelectModule, ToolbarModule,
    CardModule, MessageModule, BreadcrumbModule, CheckboxModule,
    TabsModule, AccordionModule, SkeletonModule, DatePickerModule,
    NavbarComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './superadmin.component.html',
})
export class SuperadminComponent implements OnInit {

  private readonly BASE = 'http://localhost:3000/api';

  breadcrumbItems = [{ label: 'Superadmin' }];
  breadcrumbHome  = { icon: 'pi pi-home', routerLink: '/grupo' };

  avatarColors = ['#C9A84C','#10B981','#3B82F6','#EF4444','#8B5CF6','#EC4899','#06B6D4'];

  cargando = true;

  usuarios:          any[] = [];
  usuariosFiltrados: any[] = [];
  filtroEstado   = '';
  filtroBusqueda = '';
  estadoOptions  = [
    { label: 'Con login',  value: 'activo'   },
    { label: 'Sin login',  value: 'inactivo' },
  ];

  // ── Modal permisos completos ─────────────────────────────────────────────
  modalPermisosVisible     = false;
  usuarioSeleccionado: any = null;
  cargandoPermisos         = false;

  // Permisos globales seleccionados (UUIDs)
  permisosGlobalesEditando: string[] = [];

  // Grupos del usuario con sus permisos
  gruposDelUsuario: GrupoConPermisos[] = [];

  // ── Modal editar usuario ─────────────────────────────────────────────────
  modalEditarVisible = false;
  formEditar = {
    nombre_completo: '',
    username:        '',
    telefono:        '',
    direccion:       '',
    fecha_nacimiento: null as Date | null,
  };
  erroresEditar: any = {};
  guardandoEditar    = false;

  // Helpers de categorías
  permisosGlobalesCat:  Permiso[] = [];
  permisosGrupoCat:     Permiso[] = [];
  permisosTicketsCat:   Permiso[] = [];

  constructor(
    public  shared:   SharedDataService,
    private router:   Router,
    private msg:      MessageService,
    private confirm:  ConfirmationService,
    private auth:     AuthService,
    private http:     HttpClient,
  ) {}

  async ngOnInit() {
    if (!this.shared.tienePerm('superadmin')) {
      this.router.navigate(['/acceso-denegado']); return;
    }
    await this.shared.cargarCatalogoPermisos();
    this.clasificarPermisos();
    await this.cargarUsuarios();
    this.cargando = false;
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  clasificarPermisos() {
    const todos = this.shared.todosLosPermisos;
    this.permisosGlobalesCat = todos.filter(p => PERMISOS_GLOBALES.includes(p.nombre));
    this.permisosGrupoCat    = todos.filter(p => PERMISOS_GRUPO.includes(p.nombre));
    this.permisosTicketsCat  = todos.filter(p => PERMISOS_TICKETS.includes(p.nombre));
  }

  async cargarUsuarios() {
    const { data, error } = await this.shared.db
      .from('usuarios').select('*')
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

  resolverNombres(uuids: string[]): string[] {
    return this.shared.todosLosPermisos
      .filter(p => uuids.includes(p.id)).map(p => p.nombre);
  }

  get totalUsuarios() { return this.usuarios.length + 1; }
  get totalActivos()  { return this.usuarios.filter(u => u.last_login).length + 1; }
  get totalSuperadmins() {
    return this.usuarios.filter(u =>
      this.resolverNombres(u.permisos_globales ?? []).includes('superadmin')
    ).length + 1;
  }

  aplicarFiltros() {
    this.usuariosFiltrados = this.usuarios.filter(u => {
      const matchEstado =
        !this.filtroEstado ||
        (this.filtroEstado === 'activo'   &&  u.last_login) ||
        (this.filtroEstado === 'inactivo' && !u.last_login);
      const q = this.filtroBusqueda.toLowerCase();
      const matchBusqueda = !q ||
        u.nombre_completo.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q);
      return matchEstado && matchBusqueda;
    });
  }

  getAvatarColor(id: string): string {
    const n = parseInt(id.replace(/-/g, '').slice(0, 8), 16);
    return this.avatarColors[n % this.avatarColors.length];
  }

  // ── Modal permisos completos ─────────────────────────────────────────────

  async abrirModalPermisos(u: any) {
    this.usuarioSeleccionado     = u;
    this.cargandoPermisos        = true;
    this.modalPermisosVisible    = true;
    this.gruposDelUsuario        = [];

    // Permisos globales actuales
    this.permisosGlobalesEditando = (u.permisos_globales ?? []).filter((uuid: string) =>
      this.permisosGlobalesCat.some(p => p.id === uuid)
    );

    // Cargar grupos donde es miembro y sus permisos en cada grupo
    const { data: miembros } = await this.shared.db
      .from('grupo_miembros')
      .select('grupo_id, grupos(id, nombre)')
      .eq('usuario_id', u.id);

    if (miembros?.length) {
      const gruposPromises = miembros.map(async (m: any) => {
        const { data: permsGrupo } = await this.shared.db
          .from('grupo_usuario_permisos')
          .select('permiso_id')
          .eq('grupo_id', m.grupo_id)
          .eq('usuario_id', u.id);

        return {
          id:     m.grupos.id,
          nombre: m.grupos.nombre,
          permisosActuales: (permsGrupo ?? []).map((p: any) => p.permiso_id),
        } as GrupoConPermisos;
      });
      this.gruposDelUsuario = await Promise.all(gruposPromises);
    }

    this.cargandoPermisos = false;
  }

  togglePermisoGlobal(uuid: string, activo: boolean) {
    this.permisosGlobalesEditando = activo
      ? [...new Set([...this.permisosGlobalesEditando, uuid])]
      : this.permisosGlobalesEditando.filter(p => p !== uuid);
  }

  tienePermisoGrupo(grupo: GrupoConPermisos, uuid: string): boolean {
    return grupo.permisosActuales.includes(uuid);
  }

  togglePermisoGrupo(grupo: GrupoConPermisos, uuid: string, activo: boolean) {
    grupo.permisosActuales = activo
      ? [...new Set([...grupo.permisosActuales, uuid])]
      : grupo.permisosActuales.filter(p => p !== uuid);
  }

  seleccionarTodosGrupo(grupo: GrupoConPermisos) {
    const todosGrupoYTickets = [
      ...this.permisosGrupoCat.map(p => p.id),
      ...this.permisosTicketsCat.map(p => p.id),
    ];
    grupo.permisosActuales = [...new Set([...grupo.permisosActuales, ...todosGrupoYTickets])];
  }

  limpiarTodosGrupo(grupo: GrupoConPermisos) {
    grupo.permisosActuales = [];
  }

  async guardarPermisos() {
    if (!this.usuarioSeleccionado) return;

    // 1. Guardar permisos globales (manteniendo los no-editables como superadmin si aplica)
    const permisosNoEditables = (this.usuarioSeleccionado.permisos_globales ?? []).filter(
      (uuid: string) => !this.permisosGlobalesCat.some(p => p.id === uuid)
    );
    const nuevosGlobales = [...permisosNoEditables, ...this.permisosGlobalesEditando];

    const { error: errGlobal } = await this.shared.db
      .from('usuarios')
      .update({ permisos_globales: nuevosGlobales })
      .eq('id', this.usuarioSeleccionado.id);

    if (errGlobal) {
      this.msg.add({ severity: 'error', summary: 'Error', detail: errGlobal.message }); return;
    }

    // 2. Guardar permisos por grupo
    for (const grupo of this.gruposDelUsuario) {
      // Eliminar permisos actuales del grupo
      await this.shared.db
        .from('grupo_usuario_permisos')
        .delete()
        .eq('grupo_id', grupo.id)
        .eq('usuario_id', this.usuarioSeleccionado.id);

      // Insertar los nuevos
      if (grupo.permisosActuales.length > 0) {
        await this.shared.db
          .from('grupo_usuario_permisos')
          .insert(grupo.permisosActuales.map(permiso_id => ({
            grupo_id:   grupo.id,
            usuario_id: this.usuarioSeleccionado.id,
            permiso_id,
          })));
      }
    }

    // Actualizar en memoria
    const idx = this.usuarios.findIndex(u => u.id === this.usuarioSeleccionado.id);
    if (idx !== -1) {
      this.usuarios[idx].permisos_globales = nuevosGlobales;
      this.usuarios[idx].permisosNombres   = this.resolverNombres(nuevosGlobales);
    }
    this.aplicarFiltros();

    this.msg.add({ severity: 'success', summary: 'Guardado', detail: `Permisos de ${this.usuarioSeleccionado.nombre_completo} actualizados.` });
    this.modalPermisosVisible = false;
  }

  // ── Modal editar usuario ─────────────────────────────────────────────────

  abrirModalEditar(u: any) {
    this.usuarioSeleccionado = u;
    this.erroresEditar = {};
    let fechaDate: Date | null = null;
    if (u.fecha_nacimiento) {
      const [y, m, d] = u.fecha_nacimiento.split('-').map(Number);
      fechaDate = new Date(y, m - 1, d);
    }
    this.formEditar = {
      nombre_completo:  u.nombre_completo,
      username:         u.username,
      telefono:         u.telefono,
      direccion:        u.direccion,
      fecha_nacimiento: fechaDate,
    };
    this.modalEditarVisible = true;
  }

  guardarEditar() {
    this.erroresEditar = {};
    if (!this.formEditar.nombre_completo?.trim()) this.erroresEditar.nombre_completo = 'Requerido';
    if (!this.formEditar.username?.trim())        this.erroresEditar.username        = 'Requerido';
    if (Object.keys(this.erroresEditar).length > 0) return;

    this.guardandoEditar = true;

    const payload: any = {
      nombre_completo: this.formEditar.nombre_completo,
      username:        this.formEditar.username,
      telefono:        this.formEditar.telefono,
      direccion:       this.formEditar.direccion,
      fecha_nacimiento: this.formEditar.fecha_nacimiento
        ? this.formEditar.fecha_nacimiento.toISOString().split('T')[0]
        : null,
    };

    this.http.patch<any>(
      `${this.BASE}/usuarios/${this.usuarioSeleccionado.id}`,
      payload,
      { headers: this.headers() }
    ).subscribe({
      next: (res) => {
        this.guardandoEditar = false;
        const actualizado = res.data?.usuario;
        const idx = this.usuarios.findIndex(u => u.id === this.usuarioSeleccionado.id);
        if (idx !== -1 && actualizado) {
          this.usuarios[idx] = { ...this.usuarios[idx], ...actualizado };
        }
        this.aplicarFiltros();
        this.modalEditarVisible = false;
        this.msg.add({ severity: 'success', summary: 'Guardado', detail: 'Usuario actualizado correctamente.' });
      },
      error: (err) => {
        this.guardandoEditar = false;
        this.msg.add({ severity: 'error', summary: 'Error', detail: err.error?.data?.error ?? 'No se pudo actualizar.' });
      }
    });
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────

  confirmarEliminar(u: any) {
    this.confirm.confirm({
      message:  `¿Eliminar a <b>${u.nombre_completo}</b>? Esta acción no se puede deshacer.`,
      header:   'Confirmar eliminación',
      icon:     'pi pi-trash',
      acceptLabel: 'Eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        const { error } = await this.shared.db.from('usuarios').delete().eq('id', u.id);
        if (error) { this.msg.add({ severity: 'error', summary: 'Error', detail: error.message }); return; }
        this.usuarios = this.usuarios.filter(x => x.id !== u.id);
        this.aplicarFiltros();
        this.msg.add({ severity: 'warn', summary: 'Eliminado', detail: `${u.nombre_completo} eliminado.` });
      },
    });
  }

  nombrePermiso(uuid: string): string {
    return this.shared.todosLosPermisos.find(p => p.id === uuid)?.nombre ?? uuid;
  }

  volver() { this.router.navigate(['/grupo']); }
}