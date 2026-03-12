import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { NavbarComponent } from '../navbar/navbar.component';

export interface Grupo {
  id: number;
  nombre: string;
  nivel: string;
  autor: string;
  integrantes: number;
  tickets: number;
  descripcion: string;
}

@Component({
  selector: 'app-grupo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TagModule,
    DividerModule,
    ToastModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    ConfirmDialogModule,
    TooltipModule,
    AvatarModule,
    MessageModule,
    SelectModule,
    NavbarComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './grupo.component.html',
  styleUrls: ['./grupo.component.css']
})
export class GrupoComponent implements OnInit {

  grupos: Grupo[] = [
    { id: 1, nombre: 'IDGS14', nivel: 'Avanzado',   autor: 'Brisa',    integrantes: 4, tickets: 12, descripcion: 'Grupo de desarrollo de software' },
    { id: 2, nombre: 'IDGS10', nivel: 'Intermedio', autor: 'Jonathan', integrantes: 3, tickets: 8,  descripcion: 'Grupo de análisis de sistemas' },
  ];

  nivelesOptions = [
    { label: 'Básico',     value: 'Básico' },
    { label: 'Intermedio', value: 'Intermedio' },
    { label: 'Avanzado',   value: 'Avanzado' },
  ];

  avatarColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  modalVisible = false;
  modoEdicion = false;
  grupoEditandoId: number | null = null;
  errores: any = {};

  form = this.formVacio();

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { usuario?: string };
    if (state?.usuario) {
      localStorage.setItem('usuarioActual', state.usuario);
    }
  }

  formVacio() {
    return { nombre: '', nivel: '', autor: '', integrantes: null as number | null, tickets: null as number | null, descripcion: '' };
  }

  getAvatarColor(id: number): string {
    return this.avatarColors[(id - 1) % this.avatarColors.length];
  }

  getNivelSeverity(nivel: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Básico':     'info',
      'Intermedio': 'warn',
      'Avanzado':   'success',
    };
    return map[nivel] ?? 'secondary';
  }

  irAlDashboard(grupo: Grupo) {
    this.router.navigate(['/grupo-dashboard', grupo.id], { state: { grupo } });
  }

  abrirModal() {
    this.modoEdicion = false;
    this.form = this.formVacio();
    this.errores = {};
    this.modalVisible = true;
  }

  editarCard(event: Event, grupo: Grupo) {
    event.stopPropagation();
    this.editar(grupo);
  }

  editar(grupo: Grupo) {
    this.modoEdicion = true;
    this.grupoEditandoId = grupo.id;
    this.form = { ...grupo };
    this.errores = {};
    this.modalVisible = true;
  }

  cerrarModal() {
    this.modalVisible = false;
    this.errores = {};
  }

  validar(): boolean {
    this.errores = {};
    if (!this.form.nombre?.trim())  this.errores.nombre      = 'El nombre es requerido';
    if (!this.form.nivel?.trim())   this.errores.nivel       = 'El nivel es requerido';
    if (!this.form.autor?.trim())   this.errores.autor       = 'El autor es requerido';
    if (!this.form.integrantes)     this.errores.integrantes = 'Los integrantes son requeridos';
    if (this.form.tickets === null) this.errores.tickets     = 'Los tickets son requeridos';
    return Object.keys(this.errores).length === 0;
  }

  guardar() {
    if (!this.validar()) return;

    if (this.modoEdicion) {
      const idx = this.grupos.findIndex(g => g.id === this.grupoEditandoId);
      if (idx !== -1) {
        this.grupos[idx] = { id: this.grupoEditandoId!, ...this.form } as Grupo;
        this.grupos = [...this.grupos];
      }
      this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Grupo actualizado correctamente' });
    } else {
      const nuevoId = this.grupos.length ? Math.max(...this.grupos.map(g => g.id)) + 1 : 1;
      this.grupos = [...this.grupos, { id: nuevoId, ...this.form } as Grupo];
      this.messageService.add({ severity: 'success', summary: 'Agregado', detail: 'Grupo agregado correctamente' });
    }

    this.cerrarModal();
  }

  confirmarEliminarCard(event: Event, grupo: Grupo) {
    event.stopPropagation();
    this.confirmarEliminar(grupo);
  }

  confirmarEliminar(grupo: Grupo) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el grupo <b>${grupo.nombre}</b>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.grupos = this.grupos.filter(g => g.id !== grupo.id);
        this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: `Grupo ${grupo.nombre} eliminado` });
      }
    });
  }
}