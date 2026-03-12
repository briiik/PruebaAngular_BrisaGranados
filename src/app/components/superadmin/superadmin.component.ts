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

import { SharedDataService, Usuario, TODOS_LOS_PERMISOS } from '../shared/shared-data.service';

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, InputTextModule, DialogModule,
    TagModule, AvatarModule, ToastModule, ConfirmDialogModule,
    TooltipModule, DividerModule, SelectModule, ToolbarModule,
    CardModule, MessageModule, BreadcrumbModule, CheckboxModule,
    PasswordModule, ToggleButtonModule, BadgeModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './superadmin.component.html',
})
export class SuperadminComponent implements OnInit {

  breadcrumbItems = [{ label: 'Superadmin' }];
  breadcrumbHome  = { icon: 'pi pi-home', routerLink: '/' };

  avatarColors = ['#C9A84C','#10B981','#3B82F6','#EF4444','#8B5CF6','#EC4899','#06B6D4'];

  // ── Filtros ────────────────────────────────────────────────────────────────
  filtroEstado    = '';
  filtroBusqueda  = '';
  usuariosFiltrados: Usuario[] = [];

  estadoOptions = [
    { label: 'Activos',   value: 'activo' },
    { label: 'Inactivos', value: 'inactivo' },
  ];

  // ── Expand rows ────────────────────────────────────────────────────────────
  expandedRows: { [key: number]: boolean } = {};

  // ── Todos los permisos agrupados ───────────────────────────────────────────
  todosLosPermisosAgrupados: { nombre: string; permisos: typeof TODOS_LOS_PERMISOS }[] = [];

  // ── Modal usuario (nuevo / editar) ─────────────────────────────────────────
  modalUsuarioVisible = false;
  modoEdicion         = false;
  usuarioEditandoId: number | null = null;
  erroresUsuario: any = {};

  formUsuario: { nombre: string; email: string; password: string; activo: boolean } = {
    nombre: '', email: '', password: '', activo: true,
  };

  // ── Modal permisos ─────────────────────────────────────────────────────────
  modalPermisosVisible    = false;
  usuarioEditandoPermisos: Usuario | null = null;
  permisosEditando: string[] = [];

  constructor(
    public shared: SharedDataService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.aplicarFiltros();
    this.construirPermisosAgrupados();
  }

  // ── Acceso ─────────────────────────────────────────────────────────────────
  tieneAcceso(): boolean {
    return this.shared.tienePerm('admin:users');
  }

  // ── Métricas ───────────────────────────────────────────────────────────────
  contarActivos(): number {
    return this.shared.usuarios.filter(u => u.activo).length;
  }
  contarAdmins(): number {
    return this.shared.usuarios.filter(u => u.permisos.includes('admin:users')).length;
  }

  // ── Filtros ────────────────────────────────────────────────────────────────
  aplicarFiltros() {
    this.usuariosFiltrados = this.shared.usuarios.filter(u => {
      const matchEstado = !this.filtroEstado
        || (this.filtroEstado === 'activo'   &&  u.activo)
        || (this.filtroEstado === 'inactivo' && !u.activo);
      const q = this.filtroBusqueda.toLowerCase();
      const matchBusqueda = !q
        || u.nombre.toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q);
      return matchEstado && matchBusqueda;
    });
  }

  // ── Expand ─────────────────────────────────────────────────────────────────
  toggleExpand(usuario: Usuario) {
    if (this.expandedRows[usuario.id]) {
      delete this.expandedRows[usuario.id];
    } else {
      this.expandedRows = { ...this.expandedRows, [usuario.id]: true };
    }
  }

  // ── Avatar ─────────────────────────────────────────────────────────────────
  getAvatarColor(id: number): string {
    return this.avatarColors[(id - 1) % this.avatarColors.length];
  }

  // ── Toggle activo ──────────────────────────────────────────────────────────
  onToggleActivo(usuario: Usuario) {
    this.messageService.add({
      severity: usuario.activo ? 'success' : 'warn',
      summary: usuario.activo ? 'Activado' : 'Desactivado',
      detail: `${usuario.nombre} fue ${usuario.activo ? 'activado' : 'desactivado'}.`,
    });
    this.aplicarFiltros();
  }

  // ── Permisos agrupados para la tabla expandida ─────────────────────────────
  construirPermisosAgrupados() {
    const grupos = [...new Set(TODOS_LOS_PERMISOS.map(p => p.grupo))];
    this.todosLosPermisosAgrupados = grupos.map(g => ({
      nombre:   g,
      permisos: TODOS_LOS_PERMISOS.filter(p => p.grupo === g),
    }));
  }

  permisosAgrupados(usuario: Usuario): { nombre: string; permisos: typeof TODOS_LOS_PERMISOS }[] {
    return this.todosLosPermisosAgrupados;
  }

  // ── Modal usuario ──────────────────────────────────────────────────────────
  abrirModalNuevo() {
    this.modoEdicion        = false;
    this.usuarioEditandoId  = null;
    this.formUsuario        = { nombre: '', email: '', password: '', activo: true };
    this.erroresUsuario     = {};
    this.modalUsuarioVisible = true;
  }

  abrirModalEditar(usuario: Usuario) {
    this.modoEdicion       = true;
    this.usuarioEditandoId = usuario.id;
    this.formUsuario       = { nombre: usuario.nombre, email: usuario.email, password: '', activo: usuario.activo };
    this.erroresUsuario    = {};
    this.modalUsuarioVisible = true;
  }

  validarFormUsuario(): boolean {
    this.erroresUsuario = {};
    if (!this.formUsuario.nombre.trim()) this.erroresUsuario.nombre   = 'El nombre es requerido.';
    if (!this.formUsuario.email.trim())  this.erroresUsuario.email    = 'El email es requerido.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formUsuario.email))
      this.erroresUsuario.email = 'Formato de email inválido.';
    if (!this.modoEdicion && !this.formUsuario.password.trim())
      this.erroresUsuario.password = 'La contraseña es requerida.';

    // Verificar email duplicado
    const duplicado = this.shared.usuarios.find(
      u => u.email.toLowerCase() === this.formUsuario.email.toLowerCase() && u.id !== this.usuarioEditandoId
    );
    if (duplicado) this.erroresUsuario.email = 'Ya existe un usuario con ese email.';

    return Object.keys(this.erroresUsuario).length === 0;
  }

  guardarUsuario() {
    if (!this.validarFormUsuario()) return;

    if (this.modoEdicion) {
      const idx = this.shared.usuarios.findIndex(u => u.id === this.usuarioEditandoId);
      if (idx !== -1) {
        this.shared.usuarios[idx].nombre = this.formUsuario.nombre;
        this.shared.usuarios[idx].email  = this.formUsuario.email;
        this.shared.usuarios[idx].activo = this.formUsuario.activo;
        this.shared.usuarios = [...this.shared.usuarios];
      }
      this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Usuario actualizado correctamente.' });
    } else {
      const nuevoId = this.shared.usuarios.length ? Math.max(...this.shared.usuarios.map(u => u.id)) + 1 : 1;
      this.shared.usuarios = [...this.shared.usuarios, {
        id: nuevoId,
        nombre:        this.formUsuario.nombre,
        email:         this.formUsuario.email,
        activo:        this.formUsuario.activo,
        permisos:      [],
        fechaCreacion: new Date().toISOString().split('T')[0],
      }];
      this.messageService.add({ severity: 'success', summary: 'Creado', detail: `Usuario "${this.formUsuario.nombre}" creado.` });
    }

    this.aplicarFiltros();
    this.modalUsuarioVisible = false;
  }

  // ── Modal permisos ─────────────────────────────────────────────────────────
  abrirModalPermisos(usuario: Usuario) {
    this.usuarioEditandoPermisos = usuario;
    this.permisosEditando        = [...usuario.permisos];
    this.modalPermisosVisible    = true;
  }

  togglePermiso(clave: string, activo: boolean) {
    if (activo) {
      if (!this.permisosEditando.includes(clave)) {
        this.permisosEditando = [...this.permisosEditando, clave];
      }
    } else {
      this.permisosEditando = this.permisosEditando.filter(p => p !== clave);
    }
  }

  seleccionarTodosPermisos() {
    this.permisosEditando = TODOS_LOS_PERMISOS.map(p => p.clave);
  }

  limpiarTodosPermisos() {
    this.permisosEditando = [];
  }

  guardarPermisos() {
    if (!this.usuarioEditandoPermisos) return;
    const idx = this.shared.usuarios.findIndex(u => u.id === this.usuarioEditandoPermisos!.id);
    if (idx !== -1) {
      this.shared.usuarios[idx].permisos = [...this.permisosEditando];
      this.shared.usuarios = [...this.shared.usuarios];
    }
    this.messageService.add({ severity: 'success', summary: 'Permisos guardados', detail: `Permisos de ${this.usuarioEditandoPermisos.nombre} actualizados.` });
    this.aplicarFiltros();
    this.modalPermisosVisible = false;
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────
  confirmarEliminar(usuario: Usuario) {
    this.confirmationService.confirm({
      message: `¿Eliminar al usuario <b>${usuario.nombre}</b>? Esta acción no se puede deshacer.`,
      header:  'Confirmar eliminación',
      icon:    'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.shared.usuarios = this.shared.usuarios.filter(u => u.id !== usuario.id);
        this.aplicarFiltros();
        this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: `Usuario ${usuario.nombre} eliminado.` });
      },
    });
  }

  volver() {
    this.router.navigate(['/grupo']);
  }
}