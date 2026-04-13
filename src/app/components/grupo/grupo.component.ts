import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

import { CardModule }          from 'primeng/card';
import { TagModule }           from 'primeng/tag';
import { DividerModule }       from 'primeng/divider';
import { ToastModule }         from 'primeng/toast';
import { ButtonModule }        from 'primeng/button';
import { DialogModule }        from 'primeng/dialog';
import { InputTextModule }     from 'primeng/inputtext';
import { TextareaModule }      from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule }       from 'primeng/tooltip';
import { AvatarModule }        from 'primeng/avatar';
import { MessageModule }       from 'primeng/message';
import { SelectModule }        from 'primeng/select';
import { SkeletonModule }      from 'primeng/skeleton';

import { NavbarComponent }        from '../navbar/navbar.component';
import { AuthService }            from '../../core/services/auth.service';
import { GruposService }          from '../../core/services/grupos.service';
import { TicketsService }         from '../../core/services/tickets.service';
import { SharedDataService }      from '../shared/shared-data.service';
import { PermissionService }      from '../../core/services/permission.service';
import { HasPermissionDirective } from '../shared/has-permission.directive';

@Component({
  selector: 'app-grupo',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, TagModule, DividerModule, ToastModule,
    ButtonModule, DialogModule, InputTextModule,
    TextareaModule, ConfirmDialogModule, TooltipModule,
    AvatarModule, MessageModule, SelectModule, SkeletonModule,
    NavbarComponent, HasPermissionDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './grupo.component.html',
  styleUrls: ['./grupo.component.css']
})
export class GrupoComponent implements OnInit {

  grupos:   any[] = [];
  cargando = false;
  get usuarioActual(): any {
    return this.sharedData.usuarioActual;
  }

  // Mapa de permisos por grupo: { "uuid-grupo": ["group:edit", "group:delete", ...] }
  permisosporGrupo: Record<string, string[]> = {};

  avatarColors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4'];

  modalVisible     = false;
  modoEdicion      = false;
  grupoEditandoId: string | null = null;
  errores: any     = {};
  form             = this.formVacio();

  constructor(
    private messageService:      MessageService,
    private confirmationService: ConfirmationService,
    private router:              Router,
    private authService:         AuthService,
    private gruposService:       GruposService,
    private ticketsService:      TicketsService,
    private sharedData:          SharedDataService,
    public  permissionService:   PermissionService,
  ) {}

  ngOnInit(): void {
    const raw = localStorage.getItem('erp_usuario');
    if (!raw) { this.router.navigate(['/login']); return; }

    this.sharedData.esperarListo().then(() => {
      if (!this.sharedData.usuarioActual) {
        this.router.navigate(['/login']); return;
      }
      this.cargarGrupos();
    });
  }

  // ── Permisos ────────────────────────────────────────────────────────────────

  // Permisos específicos de un grupo (usado en lógica TS y casos compuestos en template)
  tienePermEnGrupo(grupoId: string, permiso: string): boolean {
    return this.permissionService.hasPermission(permiso, grupoId);
  }

  // Verifica si el usuario actual es el creador del grupo
  esCreador(grupo: any): boolean {
    return grupo.creador_id === this.usuarioActual?.id;
  }

  puedeVerDashboard(grupo: any): boolean {
    return this.tienePermEnGrupo(grupo.id, 'group:view') || this.esCreador(grupo);
  }

  // ── Carga ───────────────────────────────────────────────────────────────────

  cargarGrupos(): void {
    this.cargando = true;
    this.gruposService.getMisGrupos().subscribe({
      next: (res) => {
        this.cargando = false;
        this.grupos = res.data ?? [];
        this.grupos.forEach((g: any) => {
          this.cargarConteoTickets(g);
          this.cargarPermisosDeGrupo(g.id);
        });
      },
      error: () => {
        this.cargando = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los grupos' });
      }
    });
  }

  cargarConteoTickets(grupo: any): void {
    this.ticketsService.getTicketsPorGrupo(grupo.id).subscribe({
      next: (res) => { grupo._totalTickets = (res.data ?? []).length; }
    });
  }

  cargarPermisosDeGrupo(grupoId: string): void {
    // Carga en PermissionService (fuente de verdad) y en mapa local para lógica compuesta
    this.permissionService.refreshPermissionsForGroup(grupoId);
    this.gruposService.getPermisos(grupoId, this.usuarioActual.id).subscribe({
      next: (res) => {
        this.permisosporGrupo[grupoId] = (res.data ?? []).map((p: any) => p.nombre);
      }
    });
  }

  // ── Navegación ──────────────────────────────────────────────────────────────

  irAlDashboard(grupo: any): void {
    this.router.navigate(['/grupo-dashboard', grupo.id], { state: { grupo } });
  }

  // ── CRUD grupos ─────────────────────────────────────────────────────────────

  abrirModal(): void {
    this.modoEdicion  = false;
    this.form         = this.formVacio();
    this.errores      = {};
    this.modalVisible = true;
  }

  editarCard(event: Event, grupo: any): void {
    event.stopPropagation();
    this.modoEdicion     = true;
    this.grupoEditandoId = grupo.id;
    this.form            = { nombre: grupo.nombre, descripcion: grupo.descripcion ?? '' };
    this.errores         = {};
    this.modalVisible    = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.errores      = {};
  }

  validar(): boolean {
    this.errores = {};
    if (!this.form.nombre?.trim()) this.errores.nombre = 'El nombre es requerido';
    return Object.keys(this.errores).length === 0;
  }

  guardar(): void {
    if (!this.validar()) return;

    if (this.modoEdicion) {
      this.gruposService.editarGrupo(this.grupoEditandoId!, this.form.nombre, this.form.descripcion).subscribe({
        next: (res) => {
          const idx = this.grupos.findIndex(g => g.id === this.grupoEditandoId);
          if (idx !== -1) {
            this.grupos[idx] = { ...this.grupos[idx], ...res.data };
            this.grupos = [...this.grupos];
          }
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Grupo actualizado correctamente' });
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.data?.error ?? 'No se pudo actualizar el grupo' });
        }
      });
    } else {
      this.gruposService.crearGrupo(this.form.nombre, this.form.descripcion).subscribe({
        next: (res) => {
          const nuevoGrupo = {
            ...res.data,
            _totalTickets: 0,
            usuarios: {
              nombre_completo: this.usuarioActual.nombre_completo,
              username:        this.usuarioActual.username
            }
          };
          this.grupos = [...this.grupos, nuevoGrupo];
          this.cargarPermisosDeGrupo(nuevoGrupo.id);
          this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Grupo creado correctamente' });
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.data?.error ?? 'No se pudo crear el grupo' });
        }
      });
    }
    this.cerrarModal();
  }

  confirmarEliminarCard(event: Event, grupo: any): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el grupo <b>${grupo.nombre}</b>?`,
      header: 'Confirmar eliminación', icon: 'pi pi-trash',
      acceptLabel: 'Eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.gruposService.eliminarGrupo(grupo.id).subscribe({
          next: () => {
            this.grupos = this.grupos.filter(g => g.id !== grupo.id);
            this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: `Grupo "${grupo.nombre}" eliminado` });
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.data?.error ?? 'No se pudo eliminar el grupo' });
          }
        });
      }
    });
  }

  // ── Helpers de UI ───────────────────────────────────────────────────────────

  getAvatarColor(id: string): string {
    const num = parseInt(id.replace(/-/g, '').substring(0, 8), 16);
    return this.avatarColors[num % this.avatarColors.length];
  }

  getNombreCreador(grupo: any): string {
    return grupo.usuarios?.nombre_completo ?? grupo.usuarios?.username ?? 'Sin autor';
  }

  getTotalTickets(): number {
    return this.grupos.reduce((acc, g) => acc + (g._totalTickets ?? 0), 0);
  }

  formVacio() {
    return { nombre: '', descripcion: '' };
  }
}