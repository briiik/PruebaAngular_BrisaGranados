import { Component, OnInit, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NavbarComponent } from '../navbar/navbar.component';
import { SharedDataService } from '../shared/shared-data.service'; // 👈 agregar

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

import { Grupo } from '../grupo/grupo.component';

export interface Comentario {
  autor: string;
  texto: string;
  fecha: string;
}

export interface HistorialItem {
  accion: string;
  descripcion: string;
  autor: string;
  fecha: string;
  icon: string;
  color: string;
}

export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  asignadoA: string;
  prioridad: string;
  fechaCreacion: string;
  fechaLimite: string;
  creadoPor: string;
  comentarios: Comentario[];
  historial: HistorialItem[];
}

export interface Integrante {
  id: number;
  nombre: string;
  rol: string;
}

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
    ChartModule, MessageModule, DatePickerModule,
    NavbarComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './grupo-dashboard.component.html',
  styleUrls: ['./grupo-dashboard.component.css'],
})
export class GrupoDashboardComponent implements OnInit {

  grupo: Grupo | null = null;
  avatarColor = '#3B82F6';
  avatarColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  breadcrumbItems: any[] = [];
  breadcrumbHome = { icon: 'pi pi-home', routerLink: '/' };

  integrantes: Integrante[] = [
    { id: 1, nombre: 'Brisa',    rol: 'Líder' },
    { id: 2, nombre: 'Jonathan', rol: 'Desarrollador' },
    { id: 3, nombre: 'Ana',      rol: 'Diseñadora' },
  ];

  estadoOptions = [
    { label: 'Pendiente',    value: 'Pendiente' },
    { label: 'En Progreso',  value: 'En Progreso' },
    { label: 'En Revisión',  value: 'En Revisión' },
    { label: 'Finalizado',   value: 'Finalizado' },
  ];

  prioridadOptions = [
    { label: 'Alta',  value: 'Alta' },
    { label: 'Media', value: 'Media' },
    { label: 'Baja',  value: 'Baja' },
  ];

  vistaActual = 'tabla';
  vistaOptions = [
    { label: 'Tabla',  value: 'tabla',  icon: 'pi pi-list' },
    { label: 'Kanban', value: 'kanban', icon: 'pi pi-th-large' },
  ];

  kanbanColumnas = [
    { estado: 'Pendiente' },
    { estado: 'En Progreso' },
    { estado: 'En Revisión' },
    { estado: 'Finalizado' },
  ];
  ticketArrastrado: Ticket | null = null;

  filtroEstado    = '';
  filtroPrioridad = '';
  ticketsFiltrados: Ticket[] = [];

  tickets: Ticket[] = [
    {
      id: 1, titulo: 'Inicio de Sesión', creadoPor: 'Brisa',
      descripcion: 'El botón de inicio de sesión no responde cuando el campo de contraseña tiene más de 20 caracteres especiales.',
      estado: 'En Progreso', asignadoA: 'Jonathan', prioridad: 'Alta',
      fechaCreacion: '2025-01-10', fechaLimite: '2026-07-20',
      comentarios: [{ autor: 'Jonathan', texto: 'Ya encontré el problema, está en el validador.', fecha: '2025-01-11' }],
      historial: [
        { accion: 'Ticket creado', descripcion: 'Ticket creado con estado Pendiente', autor: 'Brisa', fecha: '2025-01-10', icon: 'pi pi-plus', color: '#3B82F6' },
        { accion: 'Estado cambiado', descripcion: 'Pendiente → En Progreso', autor: 'Jonathan', fecha: '2025-01-11', icon: 'pi pi-refresh', color: '#F59E0B' },
      ],
    },
    {
      id: 2, titulo: 'Diseño de home', creadoPor: 'Brisa',
      descripcion: 'Rediseñar la página principal con los nuevos colores de la marca.',
      estado: 'Pendiente', asignadoA: 'Ana', prioridad: 'Media',
      fechaCreacion: '2025-01-12', fechaLimite: '2025-02-01',
      comentarios: [],
      historial: [
        { accion: 'Ticket creado', descripcion: 'Ticket creado con estado Pendiente', autor: 'Brisa', fecha: '2025-01-12', icon: 'pi pi-plus', color: '#3B82F6' },
      ],
    },
    {
      id: 3, titulo: 'API de usuarios', creadoPor: 'Brisa',
      descripcion: 'Implementar endpoints REST para CRUD de usuarios con JWT.',
      estado: 'Finalizado', asignadoA: 'Brisa', prioridad: 'Alta',
      fechaCreacion: '2025-01-08', fechaLimite: '2025-01-18',
      comentarios: [{ autor: 'Brisa', texto: 'Endpoints listos y documentados en Swagger.', fecha: '2025-01-17' }],
      historial: [
        { accion: 'Ticket creado', descripcion: 'Ticket creado con estado Pendiente', autor: 'Brisa', fecha: '2025-01-08', icon: 'pi pi-plus', color: '#3B82F6' },
        { accion: 'Estado cambiado', descripcion: 'En Progreso → Finalizado', autor: 'Brisa', fecha: '2025-01-17', icon: 'pi pi-check', color: '#10B981' },
      ],
    },
    {
      id: 4, titulo: 'Pruebas de regresión', creadoPor: 'Brisa',
      descripcion: 'Ejecutar suite completa de pruebas automatizadas.',
      estado: 'En Revisión', asignadoA: 'Jonathan', prioridad: 'Baja',
      fechaCreacion: '2025-01-15', fechaLimite: '2025-01-25',
      comentarios: [],
      historial: [
        { accion: 'Ticket creado', descripcion: 'Ticket creado con estado Pendiente', autor: 'Brisa', fecha: '2025-01-15', icon: 'pi pi-plus', color: '#3B82F6' },
      ],
    },
  ];

  modalDetalleVisible = false;
  ticketSeleccionado: Ticket | null = null;
  nuevoComentario = '';
  activeTab = '0';

  formEdicion: {
    titulo: string; descripcion: string; estado: string;
    prioridad: string; asignadoA: string; fechaLimite: string; fechaLimiteDate: Date | null;
  } = this.formEdicionVacio();

  modalNuevoVisible = false;
  erroresNuevo: any = {};
  formNuevo: {
    titulo: string; descripcion: string; estado: string;
    prioridad: string; asignadoA: string; fechaLimite: string; fechaLimiteDate: Date | null;
  } = this.formNuevoVacio();

  chartData: any = {};
  chartOptions: any = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public shared: SharedDataService, // 👈 agregar
  ) {}

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { grupo: Grupo };
    if (state?.grupo) {
      this.grupo = state.grupo;
    } else {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      this.grupo = { id, nombre: `Grupo ${id}`, nivel: 'Avanzado', autor: 'Brisa', integrantes: 3, tickets: 4, descripcion: 'Grupo de desarrollo' };
    }
    if (this.grupo) {
      this.avatarColor = this.avatarColors[(this.grupo.id - 1) % this.avatarColors.length];
      this.breadcrumbItems = [
        { label: 'Grupos', routerLink: '/grupos' },
        { label: this.grupo.nombre },
      ];
    }
    this.ticketsFiltrados = [...this.tickets];
    this.actualizarChart();
  }

  // ── Permisos — ahora usan SharedDataService ────────────────────────────────

  get usuarioActivo(): string {
    return this.shared.usuarioActivoNombre;
  }

  // Puede gestionar el grupo si tiene group:edit
  get tienePermisoCreador(): boolean {
    return this.shared.tienePerm('group:edit');
  }

  // Puede crear tickets
  get puedeCrearTicket(): boolean {
    return this.shared.tienePerm('ticket:create');
  }

  // Puede eliminar tickets
  get puedeEliminarTicket(): boolean {
    return this.shared.tienePerm('ticket:delete');
  }

  // Puede editar un campo específico del ticket
  puedeEditarCampo(campo: string): boolean {
    if (!this.ticketSeleccionado) return false;
    // Con ticket:edit puede editar todo
    if (this.shared.tienePerm('ticket:edit')) return true;
    // Sin ticket:edit pero es el asignado, solo puede cambiar estado
    if (this.ticketSeleccionado.asignadoA === this.usuarioActivo) {
      return campo === 'estado';
    }
    return false;
  }

  puedeEditarAlgo(): boolean {
    if (!this.ticketSeleccionado) return false;
    return this.shared.tienePerm('ticket:edit') ||
           this.ticketSeleccionado.asignadoA === this.usuarioActivo;
  }

  puedeComentarEnTicket(ticket: Ticket): boolean {
    // Puede comentar si tiene permiso de ver tickets y es asignado o tiene edit
    return this.shared.tienePerm('ticket:edit') ||
           ticket.asignadoA === this.usuarioActivo;
  }

  esAsignado(ticket: Ticket): boolean {
    return ticket.asignadoA === this.usuarioActivo;
  }

  // ── Chart ──────────────────────────────────────────────────────────────────
  actualizarChart() {
    this.chartData = {
      labels: ['Pendiente', 'En Progreso', 'En Revisión', 'Finalizado'],
      datasets: [{
        data: [
          this.contarPorEstado('Pendiente'),
          this.contarPorEstado('En Progreso'),
          this.contarPorEstado('En Revisión'),
          this.contarPorEstado('Finalizado'),
        ],
        backgroundColor: ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'],
        hoverBackgroundColor: ['#D97706', '#2563EB', '#7C3AED', '#059669'],
      }],
    };
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' }, tooltip: { enabled: true } },
      cutout: '60%',
    };
  }

  contarPorEstado(estado: string): number {
    return this.tickets.filter(t => t.estado === estado).length;
  }
  contarPorPrioridad(prioridad: string): number {
    return this.tickets.filter(t => t.prioridad === prioridad).length;
  }
  porcentajePrioridad(prioridad: string): number {
    return this.tickets.length ? Math.round((this.contarPorPrioridad(prioridad) / this.tickets.length) * 100) : 0;
  }

  aplicarFiltros() {
    this.ticketsFiltrados = this.tickets.filter(t => {
      const matchEstado    = !this.filtroEstado    || t.estado    === this.filtroEstado;
      const matchPrioridad = !this.filtroPrioridad || t.prioridad === this.filtroPrioridad;
      return matchEstado && matchPrioridad;
    });
  }

  getTicketsPorEstado(estado: string): Ticket[] {
    return this.ticketsFiltrados.filter(t => t.estado === estado);
  }

  onDragStart(event: DragEvent, ticket: Ticket) {
    this.ticketArrastrado = ticket;
    event.dataTransfer?.setData('text/plain', ticket.id.toString());
  }

  onDragOver(event: DragEvent) { event.preventDefault(); }

  onDrop(event: DragEvent, nuevoEstado: string) {
    event.preventDefault();
    if (!this.ticketArrastrado) return;
    const ticket = this.ticketArrastrado;
    if (ticket.estado === nuevoEstado) return;

    const puedeMoverse = this.shared.tienePerm('ticket:edit') ||
      ticket.asignadoA === this.usuarioActivo;

    if (!puedeMoverse) {
      this.messageService.add({ severity: 'error', summary: 'Sin permiso', detail: 'No puedes mover este ticket.' });
      this.ticketArrastrado = null;
      return;
    }

    const estadoAnterior = ticket.estado;
    ticket.estado = nuevoEstado;
    ticket.historial.unshift({
      accion: 'Estado cambiado (Kanban)',
      descripcion: `${estadoAnterior} → ${nuevoEstado}`,
      autor: this.usuarioActivo,
      fecha: this.hoy(),
      icon: 'pi pi-refresh',
      color: '#8B5CF6',
    });

    this.aplicarFiltros();
    this.actualizarChart();
    this.messageService.add({ severity: 'success', summary: 'Movido', detail: `Ticket movido a "${nuevoEstado}"` });
    this.ticketArrastrado = null;
  }

  getNivelSeverity(nivel: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return ({ 'Básico': 'info', 'Intermedio': 'warn', 'Avanzado': 'success' } as any)[nivel] ?? 'secondary';
  }
  getPrioridadSeverity(p: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return ({ 'Alta': 'danger', 'Media': 'warn', 'Baja': 'info' } as any)[p] ?? 'secondary';
  }
  getEstadoSeverity(e: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return ({ 'Pendiente': 'warn', 'En Progreso': 'info', 'En Revisión': 'secondary', 'Finalizado': 'success' } as any)[e] ?? 'secondary';
  }

  esVencido(fechaLimite: string): boolean {
    if (!fechaLimite) return false;
    return new Date(fechaLimite) < new Date();
  }

  abrirModalDetalle(ticket: Ticket) {
    this.modalDetalleVisible = false;
    this.ticketSeleccionado = null;
    this.activeTab = '0';
    setTimeout(() => {
      this.ticketSeleccionado = ticket;
      this.formEdicion = {
        titulo: ticket.titulo, descripcion: ticket.descripcion,
        estado: ticket.estado, prioridad: ticket.prioridad,
        asignadoA: ticket.asignadoA, fechaLimite: ticket.fechaLimite,
        fechaLimiteDate: ticket.fechaLimite ? new Date(ticket.fechaLimite) : null,
      };
      this.nuevoComentario = '';
      this.modalDetalleVisible = true;
    }, 0);
  }

  cerrarModalDetalle() {
    this.modalDetalleVisible = false;
    this.ticketSeleccionado = null;
    this.nuevoComentario = '';
  }

  guardarEdicion() {
    if (!this.ticketSeleccionado) return;
    const ticket = this.ticketSeleccionado;
    const cambios: string[] = [];

    if (this.shared.tienePerm('ticket:edit')) {
      if (ticket.titulo      !== this.formEdicion.titulo)      cambios.push(`Título actualizado`);
      if (ticket.descripcion !== this.formEdicion.descripcion) cambios.push('Descripción actualizada');
      if (ticket.prioridad   !== this.formEdicion.prioridad)   cambios.push(`Prioridad: ${ticket.prioridad} → ${this.formEdicion.prioridad}`);
      if (ticket.asignadoA   !== this.formEdicion.asignadoA)   cambios.push(`Asignado: ${ticket.asignadoA} → ${this.formEdicion.asignadoA}`);
      ticket.titulo      = this.formEdicion.titulo;
      ticket.descripcion = this.formEdicion.descripcion;
      ticket.prioridad   = this.formEdicion.prioridad;
      ticket.asignadoA   = this.formEdicion.asignadoA;
      if (this.formEdicion.fechaLimiteDate) {
        ticket.fechaLimite = this.formEdicion.fechaLimiteDate.toISOString().split('T')[0];
      }
    }

    if (ticket.estado !== this.formEdicion.estado) {
      cambios.push(`Estado: ${ticket.estado} → ${this.formEdicion.estado}`);
      ticket.estado = this.formEdicion.estado;
    }

    if (cambios.length > 0) {
      ticket.historial.unshift({
        accion: 'Ticket editado', descripcion: cambios.join(' | '),
        autor: this.usuarioActivo, fecha: this.hoy(),
        icon: 'pi pi-pencil', color: '#3B82F6',
      });
    }

    this.aplicarFiltros();
    this.actualizarChart();
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Cambios guardados correctamente' });
    this.cerrarModalDetalle();
  }

  agregarComentario() {
    if (!this.ticketSeleccionado || !this.nuevoComentario.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Vacío', detail: 'Escribe un comentario antes de enviar.' });
      return;
    }
    this.ticketSeleccionado.comentarios.push({
      autor: this.usuarioActivo,
      texto: this.nuevoComentario.trim(),
      fecha: this.hoy(),
    });
    this.ticketSeleccionado.historial.unshift({
      accion: 'Comentario agregado',
      descripcion: `"${this.nuevoComentario.trim().substring(0, 60)}..."`,
      autor: this.usuarioActivo, fecha: this.hoy(),
      icon: 'pi pi-comment', color: '#10B981',
    });
    this.nuevoComentario = '';
    this.messageService.add({ severity: 'success', summary: 'Comentario', detail: 'Comentario agregado' });
  }

  abrirModalNuevoTicket() {
    this.formNuevo = this.formNuevoVacio();
    this.erroresNuevo = {};
    this.modalNuevoVisible = true;
  }

  crearTicket() {
    this.erroresNuevo = {};
    if (!this.formNuevo.titulo?.trim()) {
      this.erroresNuevo.titulo = 'El título es obligatorio';
      return;
    }
    const nuevoId = this.tickets.length ? Math.max(...this.tickets.map(t => t.id)) + 1 : 1;
    const fechaLimite = this.formNuevo.fechaLimiteDate
      ? this.formNuevo.fechaLimiteDate.toISOString().split('T')[0] : '';

    this.tickets.push({
      id: nuevoId,
      titulo: this.formNuevo.titulo.trim(),
      descripcion: this.formNuevo.descripcion,
      estado: this.formNuevo.estado,
      prioridad: this.formNuevo.prioridad,
      asignadoA: this.formNuevo.asignadoA,
      fechaCreacion: this.hoy(),
      fechaLimite,
      creadoPor: this.usuarioActivo,
      comentarios: [],
      historial: [{
        accion: 'Ticket creado',
        descripcion: `Creado con estado "${this.formNuevo.estado}"`,
        autor: this.usuarioActivo, fecha: this.hoy(),
        icon: 'pi pi-plus', color: '#3B82F6',
      }],
    });

    this.aplicarFiltros();
    this.actualizarChart();
    this.messageService.add({ severity: 'success', summary: 'Ticket creado', detail: `"${this.formNuevo.titulo}" agregado.` });
    this.modalNuevoVisible = false;
  }

  confirmarEliminar(ticket: Ticket) {
    this.confirmationService.confirm({
      message: `¿Eliminar el ticket <b>${ticket.titulo}</b>?`,
      header: 'Confirmar eliminación', icon: 'pi pi-trash',
      acceptLabel: 'Eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.tickets = this.tickets.filter(t => t.id !== ticket.id);
        this.aplicarFiltros();
        this.actualizarChart();
        this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: `Ticket "${ticket.titulo}" eliminado` });
      },
    });
  }

  volver() { this.router.navigate(['/grupo']); }

  irAGestion() {
    this.router.navigate(['/gestion-grupo', this.grupo?.id], { state: { grupo: this.grupo } });
  }

  hoy(): string { return new Date().toLocaleDateString('es-MX'); }
  formEdicionVacio() {
    return { titulo: '', descripcion: '', estado: '', prioridad: '', asignadoA: '', fechaLimite: '', fechaLimiteDate: null as Date | null };
  }
  formNuevoVacio() {
    return { titulo: '', descripcion: '', estado: 'Pendiente', prioridad: 'Media', asignadoA: '', fechaLimite: '', fechaLimiteDate: null as Date | null };
  }
}