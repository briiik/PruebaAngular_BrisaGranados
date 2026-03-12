import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';

import { NavbarComponent } from '../navbar/navbar.component';

interface UsuarioPerfil {
  nombreCompleto: string;
  usuario: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaNacimiento: string;
}

interface FormEdicion {
  nombreCompleto: string;
  usuario: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaNacimiento: Date | null;
}

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    AvatarModule,
    TagModule,
    DividerModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    DatePickerModule,
    ToastModule,
    MessageModule,
    NavbarComponent,
  ],
  providers: [MessageService],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.css']
})
export class UsuarioComponent implements OnInit {

  usuario: UsuarioPerfil = {
    nombreCompleto: 'Brisa Granados',
    usuario: 'Brik',
    email: 'brisa.granados158@gmail.com',
    telefono: '4423786550',
    direccion: 'Calle Crisantemos 158',
    fechaNacimiento: '2000-07-08',
  };

  datosUsuario: any[] = [];

  modalEdicionVisible = false;
  modalPasswordVisible = false;

  formEdicion: FormEdicion = this.getFormVacio();

  formPassword = { actual: '', nueva: '', confirmar: '' };
  erroresPassword: any = {};

  constructor(private router: Router, private messageService: MessageService) {}

  ngOnInit() {
    this.refrescarTabla();
  }

  getFormVacio(): FormEdicion {
    return {
      nombreCompleto: this.usuario.nombreCompleto,
      usuario:        this.usuario.usuario,
      email:          this.usuario.email,
      telefono:       this.usuario.telefono,
      direccion:      this.usuario.direccion,
      fechaNacimiento: null,
    };
  }

  refrescarTabla() {
    this.datosUsuario = [
      { campo: 'Usuario',          valor: this.usuario.usuario,          icon: 'pi pi-user' },
      { campo: 'Email',            valor: this.usuario.email,            icon: 'pi pi-envelope' },
      { campo: 'Teléfono',         valor: this.usuario.telefono,         icon: 'pi pi-phone' },
      { campo: 'Dirección',        valor: this.usuario.direccion,        icon: 'pi pi-map-marker' },
      { campo: 'Fecha nacimiento', valor: this.usuario.fechaNacimiento,  icon: 'pi pi-calendar' },
    ];
  }

  volver() {
    this.router.navigate(['/grupo']);
  }

  cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    this.router.navigate(['/login']);
  }

  abrirEdicion() {
    this.formEdicion = this.getFormVacio();
    this.modalEdicionVisible = true;
  }

  guardarEdicion() {
    this.usuario.nombreCompleto = this.formEdicion.nombreCompleto;
    this.usuario.usuario        = this.formEdicion.usuario;
    this.usuario.email          = this.formEdicion.email;
    this.usuario.telefono       = this.formEdicion.telefono;
    this.usuario.direccion      = this.formEdicion.direccion;
    this.refrescarTabla();
    this.modalEdicionVisible = false;
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Perfil actualizado correctamente' });
  }

  abrirCambioPassword() {
    this.formPassword = { actual: '', nueva: '', confirmar: '' };
    this.erroresPassword = {};
    this.modalPasswordVisible = true;
  }

  guardarPassword() {
    this.erroresPassword = {};
    if (!this.formPassword.actual)
      this.erroresPassword.actual = 'Ingresa tu contraseña actual';
    if (!this.formPassword.nueva)
      this.erroresPassword.nueva = 'Ingresa la nueva contraseña';
    if (this.formPassword.nueva !== this.formPassword.confirmar)
      this.erroresPassword.confirmar = 'Las contraseñas no coinciden';
    if (Object.keys(this.erroresPassword).length > 0) return;

    this.modalPasswordVisible = false;
    this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Contraseña cambiada correctamente' });
  }
}