import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NavbarComponent } from '../navbar/navbar.component';

import { TableModule }         from 'primeng/table';
import { ButtonModule }        from 'primeng/button';
import { InputTextModule }     from 'primeng/inputtext';
import { TextareaModule }      from 'primeng/textarea';
import { DialogModule }        from 'primeng/dialog';
import { TagModule }           from 'primeng/tag';
import { AvatarModule }        from 'primeng/avatar';
import { ToastModule }         from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule }       from 'primeng/tooltip';
import { DividerModule }       from 'primeng/divider';
import { SelectModule }        from 'primeng/select';
import { ToolbarModule }       from 'primeng/toolbar';
import { TabsModule }          from 'primeng/tabs';
import { PanelModule }         from 'primeng/panel';
import { MessageModule }       from 'primeng/message';
import { BreadcrumbModule }    from 'primeng/breadcrumb';
import { ToggleButtonModule }  from 'primeng/togglebutton';

import { SharedDataService, Usuario } from '../shared/shared-data.service';
import { Grupo } from '../grupo/grupo.component';

export interface MiembroGrupo {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

@Component({
  selector: 'app-gestion-grupo',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, InputTextModule, TextareaModule,
    DialogModule, TagModule, AvatarModule, ToastModule,
    ConfirmDialogModule, TooltipModule, DividerModule,
    SelectModule, ToolbarModule, TabsModule, PanelModule,
    MessageModule, BreadcrumbModule, ToggleButtonModule,
    NavbarComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './gestion-grupo.component.html',
  styleUrls: ['./gestion-grupo.component.css'],
})
export class GestionGrupoComponent implements OnInit {

  grupo: Grupo | null = null;

  breadcrumbItems: any[] = [];
  breadcrumbHome = { icon: 'pi pi-home', routerLink: '/' };

  avatarColors = ['#C9A84C','#10B981','#3B82F6','#EF4444','#8B5CF6','#EC4899','#06B6D4'];

  miembros: MiembroGrupo[] = [
    { id: 1, nombre: 'Brisa',    email: 'brisa@mail.com',    rol: 'Líder',         activo: true  },
    { id: 2, nombre: 'Jonathan', email: 'jonathan@mail.com', rol: 'Desarrollador', activo: true  },
    { id: 3, nombre: 'Ana',      email: 'ana@mail.com',      rol: 'Diseñadora',    activo: false },
  ];

  rolesOptions = [
    { label: 'Líder',         value: 'Líder' },
    { label: 'Desarrollador', value: 'Desarrollador' },
    { label: 'Diseñador/a',   value: 'Diseñadora' },
    { label: 'Tester',        value: 'Tester' },
    { label: 'Analista',      value: 'Analista' },
  ];

  nivelesOptions = [
    { label: 'Básico',     value: 'Básico' },
    { label: 'Intermedio', value: 'Intermedio' },
    { label: 'Avanzado',   value: 'Avanzado' },
  ];

  modalAgregarVisible = false;
  emailAgregar = '';
  rolAgregar = '';
  errorEmail = '';
  usuarioEncontrado: Usuario | null = null;

  modalDetalleVisible = false;
  miembroSeleccionado: MiembroGrupo | null = null;

  modalEditarVisible = false;
  miembroEditando: MiembroGrupo | null = null;
  erroresEditar: any = {};
  formEditar: { nombre: string; email: string; rol: string; activo: boolean } = {
    nombre: '', email: '', rol: '', activo: true,
  };

  nombreGrupoEdit = '';
  descripcionGrupoEdit = '';
  nivelGrupoEdit = '';
  errorNombre = '';

  constructor(
    public shared: SharedDataService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { grupo: Grupo };
    if (state?.grupo) {
      this.grupo = state.grupo;
    } else {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      this.grupo = { id, nombre: `Grupo ${id}`, nivel: 'Avanzado', autor: 'Brisa', integrantes: 3, tickets: 0, descripcion: '' };
    }

    this.nombreGrupoEdit      = this.grupo?.nombre      ?? '';
    this.descripcionGrupoEdit = this.grupo?.descripcion ?? '';
    this.nivelGrupoEdit       = this.grupo?.nivel       ?? 'Avanzado';
  }

  puedeVerGestion(): boolean {
    return this.shared.tienePerm('group:view') ||
           this.shared.tienePerm('group:edit') ||
           this.shared.tienePerm('group:add')  ||
           this.shared.tienePerm('group:delete');
  }

  permisosGrupoActivos(): string[] {
    const gperm = ['group:view','group:edit','group:add','group:delete'];
    return this.shared.usuarioActivo?.permisos.filter(p => gperm.includes(p)) ?? [];
  }

  getPermisosGrupo(miembro: MiembroGrupo): string[] {
    const usuario = this.shared.usuarios.find(u => u.nombre === miembro.nombre);
    if (!usuario) return [];
    return usuario.permisos.filter(p => p.startsWith('group:') || p.startsWith('ticket:'));
  }

  getAvatarColor(id: number): string {
    return this.avatarColors[(id - 1) % this.avatarColors.length];
  }

  abrirModalDetalle(miembro: MiembroGrupo) {
    this.miembroSeleccionado = miembro;
    this.modalDetalleVisible = true;
  }

  abrirModalEditar(miembro: MiembroGrupo) {
    this.miembroEditando = miembro;
    this.erroresEditar   = {};
    this.formEditar = { nombre: miembro.nombre, email: miembro.email, rol: miembro.rol, activo: miembro.activo };
    this.modalEditarVisible = true;
  }

  pasarAEditar() {
    if (!this.miembroSeleccionado) return;
    this.modalDetalleVisible = false;
    this.abrirModalEditar(this.miembroSeleccionado);
  }

  guardarEdicionMiembro() {
    this.erroresEditar = {};
    if (!this.formEditar.nombre.trim()) this.erroresEditar.nombre = 'El nombre es requerido.';
    if (!this.formEditar.email.trim())  this.erroresEditar.email  = 'El email es requerido.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formEditar.email))
      this.erroresEditar.email = 'Formato de email inválido.';
    if (Object.keys(this.erroresEditar).length > 0) return;
    if (!this.miembroEditando) return;

    const idx = this.miembros.findIndex(m => m.id === this.miembroEditando!.id);
    if (idx !== -1) {
      this.miembros[idx] = { ...this.miembros[idx], nombre: this.formEditar.nombre.trim(),
        email: this.formEditar.email.trim(), rol: this.formEditar.rol, activo: this.formEditar.activo };
      this.miembros = [...this.miembros];
    }
    const usuarioIdx = this.shared.usuarios.findIndex(u => u.id === this.miembroEditando!.id);
    if (usuarioIdx !== -1) {
      this.shared.usuarios[usuarioIdx].nombre = this.formEditar.nombre.trim();
      this.shared.usuarios[usuarioIdx].email  = this.formEditar.email.trim();
      this.shared.usuarios[usuarioIdx].activo = this.formEditar.activo;
    }
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: `Datos de ${this.formEditar.nombre} actualizados.` });
    this.modalEditarVisible = false;
  }

  abrirModalAgregar() {
    this.emailAgregar = ''; this.rolAgregar = ''; this.errorEmail = ''; this.usuarioEncontrado = null;
    this.modalAgregarVisible = true;
  }

  cerrarModalAgregar() { this.modalAgregarVisible = false; }

  buscarUsuarioPorEmail() {
    this.errorEmail = ''; this.usuarioEncontrado = null;
    if (!this.emailAgregar?.trim()) { this.errorEmail = 'Ingresa un email'; return; }
    const encontrado = this.shared.usuarios.find(u => u.email.toLowerCase() === this.emailAgregar.trim().toLowerCase());
    if (!encontrado) { this.errorEmail = 'No se encontró ningún usuario con ese email.'; return; }
    const yaEsMiembro = this.miembros.some(m => m.email.toLowerCase() === encontrado.email.toLowerCase());
    if (yaEsMiembro) { this.errorEmail = 'Este usuario ya es miembro del grupo.'; return; }
    this.usuarioEncontrado = encontrado;
  }

  agregarMiembro() {
    if (!this.usuarioEncontrado || !this.rolAgregar) return;
    const nuevoId = this.miembros.length ? Math.max(...this.miembros.map(m => m.id)) + 1 : 1;
    this.miembros = [...this.miembros, { id: nuevoId, nombre: this.usuarioEncontrado.nombre,
      email: this.usuarioEncontrado.email, rol: this.rolAgregar, activo: this.usuarioEncontrado.activo }];
    this.messageService.add({ severity: 'success', summary: 'Miembro agregado', detail: `${this.usuarioEncontrado.nombre} fue agregado al grupo.` });
    this.cerrarModalAgregar();
  }

  confirmarEliminarMiembro(miembro: MiembroGrupo) {
    this.confirmationService.confirm({
      message: `¿Eliminar a <b>${miembro.nombre}</b> del grupo?`,
      header: 'Confirmar eliminación', icon: 'pi pi-user-minus',
      acceptLabel: 'Eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.miembros = this.miembros.filter(m => m.id !== miembro.id);
        this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: `${miembro.nombre} fue removido del grupo.` });
      },
    });
  }

  guardarNombreGrupo() {
    this.errorNombre = '';
    if (!this.nombreGrupoEdit?.trim()) { this.errorNombre = 'El nombre no puede estar vacío.'; return; }
    if (this.grupo) this.grupo.nombre = this.nombreGrupoEdit.trim();
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Nombre del grupo actualizado.' });
  }

  guardarCambiosGrupo() {
    this.errorNombre = '';
    if (!this.nombreGrupoEdit?.trim()) { this.errorNombre = 'El nombre no puede estar vacío.'; return; }
    if (this.grupo) {
      this.grupo.nombre      = this.nombreGrupoEdit.trim();
      this.grupo.descripcion = this.descripcionGrupoEdit;
      this.grupo.nivel       = this.nivelGrupoEdit;
    }
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Cambios del grupo guardados correctamente.' });
  }

  resetFormGrupo() {
    this.nombreGrupoEdit      = this.grupo?.nombre      ?? '';
    this.descripcionGrupoEdit = this.grupo?.descripcion ?? '';
    this.nivelGrupoEdit       = this.grupo?.nivel       ?? 'Avanzado';
    this.errorNombre = '';
  }

  confirmarArchivar() {
    this.confirmationService.confirm({
      message: '¿Deseas archivar este grupo? Quedará inactivo.',
      header: 'Archivar grupo', icon: 'pi pi-inbox',
      acceptLabel: 'Archivar', rejectLabel: 'Cancelar',
      accept: () => this.messageService.add({ severity: 'info', summary: 'Archivado', detail: 'El grupo fue archivado.' }),
    });
  }

  confirmarEliminarGrupo() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas <b>eliminar permanentemente</b> este grupo?',
      header: 'Eliminar grupo', icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'error', summary: 'Eliminado', detail: 'El grupo fue eliminado.' });
        setTimeout(() => this.router.navigate(['/grupo']), 1500);
      },
    });
  }

  volver() {
    this.router.navigate(['/grupo-dashboard', this.grupo?.id], { state: { grupo: this.grupo } });
  }
}