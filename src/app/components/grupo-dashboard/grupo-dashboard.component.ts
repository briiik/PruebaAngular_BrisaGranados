import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NavbarComponent }   from '../navbar/navbar.component';

import { CardModule }          from 'primeng/card';
import { TagModule }           from 'primeng/tag';
import { DividerModule }       from 'primeng/divider';
import { TableModule }         from 'primeng/table';
import { ToastModule }         from 'primeng/toast';
import { ButtonModule }        from 'primeng/button';
import { DialogModule }        from 'primeng/dialog';
import { InputTextModule }     from 'primeng/inputtext';
import { TextareaModule }      from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule }       from 'primeng/tooltip';
import { AvatarModule }        from 'primeng/avatar';
import { TabsModule }          from 'primeng/tabs';
import { TimelineModule }      from 'primeng/timeline';
import { PanelModule }         from 'primeng/panel';
import { ProgressBarModule }   from 'primeng/progressbar';
import { BreadcrumbModule }    from 'primeng/breadcrumb';
import { SelectModule }        from 'primeng/select';
import { ToolbarModule }       from 'primeng/toolbar';
import { SelectButtonModule }  from 'primeng/selectbutton';
import { BadgeModule }         from 'primeng/badge';
import { ChartModule }         from 'primeng/chart';
import { MessageModule }       from 'primeng/message';
import { DatePickerModule }    from 'primeng/datepicker';
import { SkeletonModule }      from 'primeng/skeleton';

import { AuthService }    from '../../core/services/auth.service';
import { GruposService }  from '../../core/services/grupos.service';
import { TicketsService } from '../../core/services/tickets.service';

@Component({
  selector: 'app-grupo-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, TagModule, DividerModule, TableModule, ToastModule,
    ButtonModule, DialogModule, InputTextModule, TextareaModule,
    ConfirmDialogModule, TooltipModule, AvatarModule, TabsModule,
    TimelineModule, PanelModule, ProgressBarModule, BreadcrumbModule,
    SelectModule, ToolbarModule, SelectButtonModule, BadgeModule,
    ChartModule, MessageModule, DatePickerModule, SkeletonModule,
    NavbarComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './grupo-dashboard.component.html',
  styleUrls:   ['./grupo-dashboard.component.css'],
})
export class GrupoDashboardComponent implements OnInit {

  // ── Estado general ──────────────────────────────────────────────────────────
  grupos:         any[]   = [];
  grupoActual:    any     = null;
  tickets:        any[]   = [];
  ticketsFiltrados: any[] = [];
  miembros:       any[]   = [];
  estados:        any[]   = [];
  prioridades:    any[]   = [];
  permisosUsuario: string[] = [];   // nombres de permisos, ej: ['ticket:view','ticket:create']

  cargandoGrupos  = false;
  cargandoTickets = false;

  usuarioActual: any = null;   // objeto del localStorage

  avatarColors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4'];

  breadcrumbItems: any[] = [];
  breadcrumbHome = { icon: 'pi pi-home', routerLink: '/dashboard' };

  // ── Opciones de UI ──────────────────────────────────────────────────────────
  estadoOptions:    any[] = [];
  prioridadOptions: any[] = [];

  vistaActual = 'tabla';
  vistaOptions = [
    { label: 'Tabla',  value: 'tabla',  icon: 'pi pi-list'     },
    { label: 'Kanban', value: 'kanban', icon: 'pi pi-th-large' },
  ];

  kanbanColumnas: any[] = [];
  ticketArrastrado: any = null;
  filtroEstado    = '';
  filtroPrioridad = '';

  // ── Modal detalle ───────────────────────────────────────────────────────────
  modalDetalleVisible  = false;
  ticketSeleccionado:  any   = null;
  nuevoComentario      = '';
  activeTab            = '0';
  formEdicion: any     = {};

  // ── Modal nuevo ticket ──────────────────────────────────────────────────────
  modalNuevoVisible = false;
  erroresNuevo: any = {};
  formNuevo: any    = {};

  // ── Chart ───────────────────────────────────────────────────────────────────
  chartData:    any = {};
  chartOptions: any = {};

  constructor(
    private router:              Router,
    private route:               ActivatedRoute,
    private messageService:      MessageService,
    private confirmationService: ConfirmationService,
    private authService:         AuthService,
    private gruposService:       GruposService,
    private ticketsService:      TicketsService,
  ) {}

  ngOnInit(): void {
    const raw = localStorage.getItem('erp_usuario');
    if (!raw) { this.router.navigate(['/login']); return; }
    this.usuarioActual = JSON.parse(raw);

    // Intentar obtener el grupo desde el state de navegación
    const navState = this.router.getCurrentNavigation()?.extras?.state ?? history.state;
    const grupoDesdeNav = navState?.['grupo'] ?? null;

    this.cargarCatalogos();

    if (grupoDesdeNav) {
      // Ya sabemos qué grupo es, lo seleccionamos directamente
      this.grupos = [grupoDesdeNav];
      this.seleccionarGrupo(grupoDesdeNav);
    } else {
      // Fallback: usar el :id de la URL
      const grupoId = this.route.snapshot.paramMap.get('id');
      if (grupoId) {
        this.gruposService.getGrupo(grupoId).subscribe({
          next: (res) => this.seleccionarGrupo(res.data),
          error: () => this.router.navigate(['/grupo'])
        });
      } else {
        this.router.navigate(['/grupo']);
      }
    }
  }

  // ── Helpers de permisos ─────────────────────────────────────────────────────
  tienePerm(permiso: string): boolean {
    return this.permisosUsuario.includes(permiso);
  }

  // ── Carga de datos ──────────────────────────────────────────────────────────
  cargarCatalogos(): void {
    // Estados
    this.gruposService['http']
      .get<any>('http://localhost:3000/api/estados', {
        headers: { Authorization: `Bearer ${this.authService.getToken()}` }
      })
      .subscribe({
        next: (res: any) => {
          this.estados = res.data ?? [];
          this.estadoOptions = this.estados.map(e => ({ label: e.nombre, value: e.id }));
          this.kanbanColumnas = this.estados.map(e => ({ estado: e.nombre, id: e.id, color: e.color }));
        }
      });

    // Prioridades
    this.gruposService['http']
      .get<any>('http://localhost:3000/api/prioridades', {
        headers: { Authorization: `Bearer ${this.authService.getToken()}` }
      })
      .subscribe({
        next: (res: any) => {
          this.prioridades = res.data ?? [];
          this.prioridadOptions = this.prioridades.map(p => ({ label: p.nombre, value: p.id }));
        }
      });
  }

  //cargarGrupos(): void {
  //  this.cargandoGrupos = true;
  //  this.gruposService.getMisGrupos().subscribe({
  //    next: (res) => {
  //      this.cargandoGrupos = false;
  //      this.grupos = res.data ?? [];
  //      if (this.grupos.length > 0) {
  //        this.seleccionarGrupo(this.grupos[0]);
  //      }
  //    },
  //    error: () => {
  //      this.cargandoGrupos = false;
  //      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los grupos' });
  //    }
  //  });
  //}

  seleccionarGrupo(grupo: any): void {
    this.grupoActual = grupo;
    this.breadcrumbItems = [
      { label: 'Mis Grupos' },
      { label: grupo.nombre }
    ];

    this.gruposService.getPermisos(grupo.id, this.usuarioActual.id).subscribe({
      next: (res) => {
        this.permisosUsuario = (res.data ?? []).map((p: any) => p.nombre);

        // ← Verificar acceso al dashboard
        if (!this.tienePerm('group:view')) {
          this.messageService.add({
            severity: 'error',
            summary: 'Acceso denegado',
            detail: 'No tienes permiso para ver este grupo'
          });
          this.router.navigate(['/grupo']);
          return;
        }

        this.cargarTickets(grupo.id);
        this.cargarMiembros(grupo.id);
      }
    });
  }

  cargarTickets(grupoId: string): void {
    this.cargandoTickets = true;
    this.ticketsService.getTicketsPorGrupo(grupoId).subscribe({
      next: (res) => {
        this.cargandoTickets = false;
        this.tickets = res.data ?? [];
        this.aplicarFiltros();
        this.actualizarChart();
      },
      error: () => {
        this.cargandoTickets = false;
      }
    });
  }

  cargarMiembros(grupoId: string): void {
    this.gruposService.getMiembros(grupoId).subscribe({
      next: (res) => { this.miembros = res.data ?? []; }
    });
  }

  // ── Filtros ─────────────────────────────────────────────────────────────────
  aplicarFiltros(): void {
    this.ticketsFiltrados = this.tickets.filter(t => {
      const matchEstado    = !this.filtroEstado    || t.estado_id    === this.filtroEstado;
      const matchPrioridad = !this.filtroPrioridad || t.prioridad_id === this.filtroPrioridad;
      return matchEstado && matchPrioridad;
    });
  }

  getTicketsPorEstado(estadoId: string): any[] {
    return this.ticketsFiltrados.filter(t => t.estado_id === estadoId);
  }

  // ── Kanban drag & drop ──────────────────────────────────────────────────────
  onDragStart(event: DragEvent, ticket: any): void {
    this.ticketArrastrado = ticket;
    event.dataTransfer?.setData('text/plain', ticket.id);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); }

  onDrop(event: DragEvent, estadoId: string): void {
    event.preventDefault();
    if (!this.ticketArrastrado || this.ticketArrastrado.estado_id === estadoId) return;

    const ticket = this.ticketArrastrado;
    const esAsignado = ticket.asignado_id === this.usuarioActual.id;

    if (!this.tienePerm('ticket:edit') && !esAsignado) {
      this.messageService.add({ severity: 'error', summary: 'Sin permiso', detail: 'No puedes mover este ticket.' });
      this.ticketArrastrado = null;
      return;
    }

    this.ticketsService.cambiarEstado(ticket.id, estadoId).subscribe({
      next: () => {
        ticket.estado_id = estadoId;
        ticket.estados   = this.estados.find(e => e.id === estadoId);
        this.aplicarFiltros();
        this.actualizarChart();
        this.messageService.add({ severity: 'success', summary: 'Movido', detail: 'Estado actualizado' });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.data?.error ?? 'No se pudo mover el ticket' });
      }
    });
    this.ticketArrastrado = null;
  }

  // ── Chart ───────────────────────────────────────────────────────────────────
  actualizarChart(): void {
    const labels = this.estados.map(e => e.nombre);
    const valores = this.estados.map(e => this.tickets.filter(t => t.estado_id === e.id).length);
    const colores = ['#F59E0B','#3B82F6','#8B5CF6','#10B981'];

    this.chartData = {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: colores,
        hoverBackgroundColor: colores,
      }]
    };
    this.chartOptions = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      cutout: '60%',
    };
  }

  contarPorEstado(estadoId: string): number {
    return this.tickets.filter(t => t.estado_id === estadoId).length;
  }
  contarPorPrioridad(prioridadId: string): number {
    return this.tickets.filter(t => t.prioridad_id === prioridadId).length;
  }
  porcentajePrioridad(prioridadId: string): number {
    return this.tickets.length
      ? Math.round((this.contarPorPrioridad(prioridadId) / this.tickets.length) * 100)
      : 0;
  }

  // ── Modal detalle ───────────────────────────────────────────────────────────
  abrirModalDetalle(ticket: any): void {
    this.modalDetalleVisible = false;
    this.ticketSeleccionado  = null;
    this.activeTab = '0';
    setTimeout(() => {
      // Cargar detalle completo (con comentarios e historial)
      this.ticketsService.getTicket(ticket.id).subscribe({
        next: (res) => {
          this.ticketSeleccionado = res.data;
          this.formEdicion = {
            titulo:          res.data.titulo,
            descripcion:     res.data.descripcion,
            estado_id:       res.data.estado_id,
            prioridad_id:    res.data.prioridad_id,
            asignado_id:     res.data.asignado_id,
            fechaLimiteDate: res.data.fecha_final ? new Date(res.data.fecha_final) : null,
          };
          this.nuevoComentario    = '';
          this.modalDetalleVisible = true;
        }
      });
    }, 0);
  }

  cerrarModalDetalle(): void {
    this.modalDetalleVisible = false;
    this.ticketSeleccionado  = null;
    this.nuevoComentario     = '';
  }

  guardarEdicion(): void {
    if (!this.ticketSeleccionado) return;

    const payload: any = {};
    const esAutor    = this.esAutorTicket(this.ticketSeleccionado);
    const esAsignado = this.esAsignadoTicket(this.ticketSeleccionado);
    const puedeEdit  = this.tienePerm('ticket:edit') || esAutor;

    if (puedeEdit) {
      payload.titulo       = this.formEdicion.titulo;
      payload.descripcion  = this.formEdicion.descripcion;
      payload.prioridad_id = this.formEdicion.prioridad_id;
      if (this.formEdicion.fechaLimiteDate) {
        payload.fecha_final = this.formEdicion.fechaLimiteDate.toISOString();
      }
    }

    // Asignar: solo si tiene permiso o es autor
    if (this.tienePerm('ticket:assign') || esAutor) {
      payload.asignado_id = this.formEdicion.asignado_id;
    }

    // Estado: si puede editar o es el asignado
    if (puedeEdit || esAsignado) {
      payload.estado_id = this.formEdicion.estado_id;
    }

    if (Object.keys(payload).length === 0) return;

    this.ticketsService.editarTicket(this.ticketSeleccionado.id, payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Cambios guardados correctamente' });
        this.cargarTickets(this.grupoActual.id);
        this.cerrarModalDetalle();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.data?.error ?? 'No se pudo guardar' });
      }
    });
  }

  agregarComentario(): void {
    if (!this.ticketSeleccionado || !this.nuevoComentario.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Vacío', detail: 'Escribe un comentario' });
      return;
    }

    this.ticketsService.agregarComentario(this.ticketSeleccionado.id, this.nuevoComentario).subscribe({
      next: () => {
        this.nuevoComentario = '';
        this.messageService.add({ severity: 'success', summary: 'Comentario', detail: 'Comentario agregado' });
        // Recargar detalle para mostrar el nuevo comentario
        this.ticketsService.getTicket(this.ticketSeleccionado.id).subscribe({
          next: (res) => { this.ticketSeleccionado = res.data; }
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo agregar el comentario' });
      }
    });
  }

  // ── Modal nuevo ticket ──────────────────────────────────────────────────────
  abrirModalNuevoTicket(): void {
    this.formNuevo    = {
      titulo:          '',
      descripcion:     '',
      estado_id:       this.estados[0]?.id ?? '',
      prioridad_id:    this.prioridades[1]?.id ?? '',  // Media por defecto
      asignado_id:     '',
      fechaLimiteDate: null
    };
    this.erroresNuevo     = {};
    this.modalNuevoVisible = true;
  }

  crearTicket(): void {
    this.erroresNuevo = {};
    if (!this.formNuevo.titulo?.trim()) {
      this.erroresNuevo.titulo = 'El título es obligatorio';
      return;
    }

    const payload = {
      grupo_id:    this.grupoActual.id,
      titulo:      this.formNuevo.titulo.trim(),
      descripcion: this.formNuevo.descripcion,
      estado_id:   this.formNuevo.estado_id,
      prioridad_id: this.formNuevo.prioridad_id,
      asignado_id: this.formNuevo.asignado_id || null,
      fecha_final: this.formNuevo.fechaLimiteDate
        ? this.formNuevo.fechaLimiteDate.toISOString() : null
    };

    this.ticketsService.crearTicket(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Ticket creado', detail: `"${this.formNuevo.titulo}" agregado` });
        this.modalNuevoVisible = false;
        this.cargarTickets(this.grupoActual.id);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.data?.error ?? 'No se pudo crear el ticket' });
      }
    });
  }

  confirmarEliminar(ticket: any): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el ticket <b>${ticket.titulo}</b>?`,
      header: 'Confirmar eliminación', icon: 'pi pi-trash',
      acceptLabel: 'Eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.ticketsService.eliminarTicket(ticket.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: `"${ticket.titulo}" eliminado` });
            this.cargarTickets(this.grupoActual.id);
          }
        });
      }
    });
  }

  // ── Helpers de UI ───────────────────────────────────────────────────────────
  getNombreEstado(estadoId: string): string {
    return this.estados.find(e => e.id === estadoId)?.nombre ?? estadoId;
  }
  getNombrePrioridad(prioridadId: string): string {
    return this.prioridades.find(p => p.id === prioridadId)?.nombre ?? prioridadId;
  }
  getColorEstado(estadoId: string): string {
    return this.estados.find(e => e.id === estadoId)?.color ?? '#ccc';
  }
  getAvatarColor(idx: number): string {
    return this.avatarColors[idx % this.avatarColors.length];
  }

  getPrioridadSeverity(nombre: string): 'success'|'info'|'warn'|'danger'|'secondary' {
    return ({ Alta: 'danger', Media: 'warn', Baja: 'info' } as any)[nombre] ?? 'secondary';
  }
  getEstadoSeverity(nombre: string): 'success'|'info'|'warn'|'danger'|'secondary' {
    return ({ Pendiente: 'warn', 'En Progreso': 'info', 'En Revisión': 'secondary', Finalizado: 'success' } as any)[nombre] ?? 'secondary';
  }

  esVencido(fecha: string): boolean {
    return fecha ? new Date(fecha) < new Date() : false;
  }

  puedeEditarCampo(campo: string): boolean {
    if (!this.ticketSeleccionado) return false;
    // Edición completa: tiene permiso o es autor
    if (this.tienePerm('ticket:edit') || this.esAutorTicket(this.ticketSeleccionado)) return true;
    // El asignado solo puede cambiar el estado
    if (this.esAsignadoTicket(this.ticketSeleccionado)) return campo === 'estado_id';
    return false;
  }

  puedeEditarAlgo(): boolean {
    if (!this.ticketSeleccionado) return false;
    return this.puedeEditarTicket(this.ticketSeleccionado) || 
          this.esAsignadoTicket(this.ticketSeleccionado);
  }

// ── Permisos de tickets ────────────────────────────────────────────────────
esAutorTicket(ticket: any): boolean {
  return ticket?.autor_id === this.usuarioActual?.id;
}

esAsignadoTicket(ticket: any): boolean {
  return ticket?.asignado_id === this.usuarioActual?.id;
}

puedeCrearTicket(): boolean {
  return this.tienePerm('ticket:create');
}

puedeEditarTicket(ticket: any): boolean {
  // Tiene permiso explícito O es el autor del ticket
  return this.tienePerm('ticket:edit') || this.esAutorTicket(ticket);
}

puedeEliminarTicket(ticket: any): boolean {
  // Tiene permiso explícito O es el autor del ticket
  return this.tienePerm('ticket:delete') || this.esAutorTicket(ticket);
}

puedeAsignarTicket(ticket: any): boolean {
  // Tiene permiso explícito O es el autor del ticket
  return this.tienePerm('ticket:assign') || this.esAutorTicket(ticket);
}

puedeComentarEnTicket(ticket: any): boolean {
  // Puede comentar si tiene permiso de editar, es autor o es el asignado
  return this.tienePerm('ticket:edit') || 
         this.esAutorTicket(ticket) || 
         this.esAsignadoTicket(ticket);
}

  volver(): void { this.router.navigate(['/grupo']); }

  irAGestion(): void {
    this.router.navigate(['/gestion-grupo', this.grupoActual?.id], { state: { grupo: this.grupoActual } });
  }

  hoy(): string { return new Date().toLocaleDateString('es-MX'); }
}