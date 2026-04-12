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
import { SkeletonModule }      from 'primeng/skeleton';
import { CheckboxModule }      from 'primeng/checkbox';

import { AuthService }   from '../../core/services/auth.service';
import { GruposService } from '../../core/services/grupos.service';

@Component({
  selector: 'app-gestion-grupo',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, InputTextModule, TextareaModule,
    DialogModule, TagModule, AvatarModule, ToastModule,
    ConfirmDialogModule, TooltipModule, DividerModule,
    SelectModule, ToolbarModule, TabsModule, PanelModule,
    MessageModule, BreadcrumbModule, SkeletonModule,
    CheckboxModule, NavbarComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './gestion-grupo.component.html',
  styleUrls: ['./gestion-grupo.component.css'],
})
export class GestionGrupoComponent implements OnInit {

  grupo:           any    = null;
  grupoId:         string = '';
  usuarioActual:   any    = null;
  permisosUsuario: string[] = [];

  miembros:        any[]  = [];
  todosPermisos:   any[]  = [];
  cargandoMiembros = false;

  avatarColors = ['#C9A84C','#10B981','#3B82F6','#EF4444','#8B5CF6','#EC4899','#06B6D4'];

  // ── Modal agregar miembro ───────────────────────────────────────────────────
  modalAgregarVisible  = false;
  emailAgregar         = '';
  errorEmail           = '';
  usuarioEncontrado:   any = null;
  buscandoUsuario      = false;
  // Permisos seleccionados para el nuevo miembro
  permisosSeleccionados: string[] = [];

  // ── Modal editar permisos ───────────────────────────────────────────────────
  modalPermisosVisible    = false;
  miembroEditandoPermisos: any    = null;
  permisosEditando:        string[] = [];
  cargandoPermisosMiembro  = false;
  guardandoPermisos        = false;

  // ── Modal detalle ───────────────────────────────────────────────────────────
  modalDetalleVisible  = false;
  miembroSeleccionado: any   = null;
  permisosMiembro:     any[] = [];

  // ── Configuración grupo ─────────────────────────────────────────────────────
  nombreGrupoEdit      = '';
  descripcionGrupoEdit = '';
  errorNombre          = '';
  guardandoGrupo       = false;

  constructor(
    public  authService:         AuthService,
    private gruposService:       GruposService,
    private router:              Router,
    private route:               ActivatedRoute,
    private messageService:      MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    const raw = localStorage.getItem('erp_usuario');
    if (!raw) { this.router.navigate(['/login']); return; }
    this.usuarioActual = JSON.parse(raw);

    this.grupoId = this.route.snapshot.paramMap.get('id') ?? '';

    const nav   = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { grupo: any };
    if (state?.grupo) {
      this.grupo = state.grupo;
    }

    this.cargarDatos();
  }

  // ── Carga ───────────────────────────────────────────────────────────────────

  cargarDatos(): void {
    this.cargarPermisos();
    this.cargarMiembros();
    this.cargarTodosPermisos();

    if (!this.grupo) {
      this.gruposService.getGrupo(this.grupoId).subscribe({
        next: (res) => {
          this.grupo            = res.data;
          this.nombreGrupoEdit      = this.grupo?.nombre      ?? '';
          this.descripcionGrupoEdit = this.grupo?.descripcion ?? '';
        }
      });
    } else {
      this.nombreGrupoEdit      = this.grupo?.nombre      ?? '';
      this.descripcionGrupoEdit = this.grupo?.descripcion ?? '';
    }
  }

  cargarPermisos(): void {
    this.gruposService.getPermisos(this.grupoId, this.usuarioActual.id).subscribe({
      next: (res) => {
        this.permisosUsuario = (res.data ?? []).map((p: any) => p.nombre);

        if (!this.tienePerm('group:manage')) {
          this.messageService.add({
            severity: 'error',
            summary: 'Acceso denegado',
            detail: 'No tienes permisos para gestionar este grupo'
          });
          this.router.navigate(['/grupo-dashboard', this.grupoId], {
            state: { grupo: this.grupo }
          });
        }
      }
    });
  }

  cargarMiembros(): void {
    this.cargandoMiembros = true;
    this.gruposService.getMiembros(this.grupoId).subscribe({
      next: (res) => {
        this.cargandoMiembros = false;
        this.miembros = res.data ?? [];
      },
      error: () => { this.cargandoMiembros = false; }
    });
  }

  cargarTodosPermisos(): void {
  this.gruposService.getCatalogoPermisos().subscribe({
    next: (res) => {
      this.todosPermisos = (res.data ?? []).filter((p: any) =>
        !['superadmin', 'group:create'].includes(p.nombre)
      );
    }
  });
}

  // ── Helpers ─────────────────────────────────────────────────────────────────

  tienePerm(permiso: string): boolean {
    return this.permisosUsuario.includes(permiso);
  }

  esUsuarioActual(miembro: any): boolean {
  return miembro?.usuarios?.id === this.usuarioActual?.id;
}

esCreadorGrupo(miembro: any): boolean {
  return miembro?.usuarios?.id === this.grupo?.creador_id;
}

getNombre(miembro: any): string {
  return miembro?.usuarios?.nombre_completo ?? miembro?.usuarios?.username ?? '—';
}

getEmail(miembro: any): string {
  return miembro?.usuarios?.email ?? '—';
}

getAvatarColor(id: string): string {
  if (!id) return this.avatarColors[0];
  const num = parseInt(id.replace(/-/g,'').substring(0, 8), 16);
  return this.avatarColors[num % this.avatarColors.length];
}

  // Devuelve los permisos de grupo separados de los de ticket para mostrarlos organizados
  permisosDeGrupo(permisos: any[]): any[] {
    return permisos.filter(p => p.nombre.startsWith('group:'));
  }

  permisosDeTicket(permisos: any[]): any[] {
    return permisos.filter(p => p.nombre.startsWith('ticket:'));
  }

  // ── Modal detalle ───────────────────────────────────────────────────────────

  abrirModalDetalle(miembro: any): void {
    this.miembroSeleccionado = miembro;
    this.permisosMiembro     = [];
    this.modalDetalleVisible = true;
    this.cargandoPermisosMiembro = true;

    this.gruposService.getPermisos(this.grupoId, miembro.usuarios?.id).subscribe({
      next: (res) => {
        this.cargandoPermisosMiembro = false;
        this.permisosMiembro = res.data ?? [];
      },
      error: () => { this.cargandoPermisosMiembro = false; }
    });
  }

  // ── Modal editar permisos ───────────────────────────────────────────────────

  abrirModalPermisos(miembro: any): void {
    this.miembroEditandoPermisos = miembro;
    this.permisosEditando        = [];
    this.modalPermisosVisible    = true;
    this.cargandoPermisosMiembro = true;

    this.gruposService.getPermisos(this.grupoId, miembro.usuarios?.id).subscribe({
      next: (res) => {
        this.cargandoPermisosMiembro = false;
        // Precargar los permisos actuales del miembro como seleccionados
        this.permisosEditando = (res.data ?? []).map((p: any) => p.id);
      },
      error: () => { this.cargandoPermisosMiembro = false; }
    });
  }

  guardarPermisosMiembro(): void {
    if (!this.miembroEditandoPermisos) return;
    this.guardandoPermisos = true;

    const usuarioId = this.miembroEditandoPermisos.usuarios?.id;

    this.gruposService.actualizarPermisosMiembro(
      this.grupoId,
      usuarioId,
      this.permisosEditando
    ).subscribe({
      next: () => {
        this.guardandoPermisos    = false;
        this.modalPermisosVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Permisos actualizados',
          detail: `Permisos de ${this.getNombre(this.miembroEditandoPermisos)} actualizados`
        });
      },
      error: (err) => {
        this.guardandoPermisos = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.data?.error ?? 'No se pudieron actualizar los permisos'
        });
      }
    });
  }

  // ── Modal agregar miembro ───────────────────────────────────────────────────

  abrirModalAgregar(): void {
    this.emailAgregar          = '';
    this.errorEmail            = '';
    this.usuarioEncontrado     = null;
    this.buscandoUsuario       = false;
    // Permisos por default: group:view y ticket:view
    this.permisosSeleccionados = this.todosPermisos
      .filter(p => ['group:view', 'ticket:view'].includes(p.nombre))
      .map(p => p.id);
    this.modalAgregarVisible   = true;
  }

  cerrarModalAgregar(): void { this.modalAgregarVisible = false; }

  buscarUsuarioPorEmail(): void {
    this.errorEmail        = '';
    this.usuarioEncontrado = null;
    if (!this.emailAgregar?.trim()) { this.errorEmail = 'Ingresa un email'; return; }

    const yaEsMiembro = this.miembros.some(m =>
      this.getEmail(m).toLowerCase() === this.emailAgregar.trim().toLowerCase()
    );
    if (yaEsMiembro) { this.errorEmail = 'Este usuario ya es miembro del grupo.'; return; }

    this.buscandoUsuario = true;
    const headers = { Authorization: `Bearer ${this.authService.getToken()}` };

    this.gruposService['http']
      .get<any>(`http://localhost:3000/api/usuarios/buscar?email=${encodeURIComponent(this.emailAgregar.trim())}`, { headers })
      .subscribe({
        next: (res: any) => {
          this.buscandoUsuario   = false;
          this.usuarioEncontrado = res.data;
        },
        error: () => {
          this.buscandoUsuario = false;
          this.errorEmail      = 'No se encontró ningún usuario con ese email.';
        }
      });
  }

  agregarMiembro(): void {
    if (!this.usuarioEncontrado) return;

    const usuario = this.usuarioEncontrado;

    this.gruposService.agregarMiembro(
      this.grupoId,
      usuario.id,
      this.permisosSeleccionados
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Agregado',
          detail: `${usuario.nombre_completo ?? usuario.username} fue agregado al grupo`
        });
        this.cargarMiembros();
        this.cerrarModalAgregar();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.data?.error ?? 'No se pudo agregar el miembro'
        });
      }
    });
  }

  // ── Eliminar miembro ────────────────────────────────────────────────────────

  confirmarEliminarMiembro(miembro: any): void {
    this.confirmationService.confirm({
      message: `¿Eliminar a <b>${this.getNombre(miembro)}</b> del grupo?`,
      header: 'Confirmar eliminación', icon: 'pi pi-user-minus',
      acceptLabel: 'Eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.gruposService.eliminarMiembro(this.grupoId, miembro.usuarios?.id).subscribe({
          next: () => {
            this.miembros = this.miembros.filter(m => m.usuarios?.id !== miembro.usuarios?.id);
            this.messageService.add({
              severity: 'warn',
              summary: 'Eliminado',
              detail: `${this.getNombre(miembro)} fue removido del grupo`
            });
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.data?.error ?? 'No se pudo eliminar el miembro'
            });
          }
        });
      },
    });
  }

  // ── Configuración del grupo ─────────────────────────────────────────────────

  guardarCambiosGrupo(): void {
    this.errorNombre = '';
    if (!this.nombreGrupoEdit?.trim()) {
      this.errorNombre = 'El nombre no puede estar vacío.';
      return;
    }

    this.guardandoGrupo = true;
    this.gruposService.editarGrupo(
      this.grupoId,
      this.nombreGrupoEdit.trim(),
      this.descripcionGrupoEdit
    ).subscribe({
      next: (res) => {
        this.guardandoGrupo    = false;
        this.grupo.nombre      = res.data.nombre;
        this.grupo.descripcion = res.data.descripcion;
        this.messageService.add({
          severity: 'success',
          summary: 'Guardado',
          detail: 'Cambios del grupo guardados correctamente'
        });
      },
      error: (err) => {
        this.guardandoGrupo = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.data?.error ?? 'No se pudo guardar'
        });
      }
    });
  }

  resetFormGrupo(): void {
    this.nombreGrupoEdit      = this.grupo?.nombre      ?? '';
    this.descripcionGrupoEdit = this.grupo?.descripcion ?? '';
    this.errorNombre          = '';
  }

  confirmarEliminarGrupo(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas <b>eliminar permanentemente</b> este grupo?',
      header: 'Eliminar grupo', icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.gruposService.eliminarGrupo(this.grupoId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Eliminado',
              detail: 'El grupo fue eliminado'
            });
            setTimeout(() => this.router.navigate(['/grupo']), 1500);
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.data?.error ?? 'No se pudo eliminar el grupo'
            });
          }
        });
      },
    });
  }

  volver(): void {
    this.router.navigate(['/grupo-dashboard', this.grupoId], { state: { grupo: this.grupo } });
  }
}