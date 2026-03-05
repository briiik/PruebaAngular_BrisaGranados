import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PasswordModule } from 'primeng/password';
import { DatePickerModule } from 'primeng/datepicker';

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
    ToastModule,
    DialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    PasswordModule,
    DatePickerModule
  ],
  providers: [MessageService],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.css']
})
export class UsuarioComponent {

  // Datos del usuario (simulando los del registro)
  usuario = {
    usuario:         'admin',
    nombreCompleto:  'Brisa Granados C',
    email:           '2018140039@uteq.edu.mx',
    telefono:        '4423786550',
    direccion:       'Col. Insurgentes 158, Querétaro',
    fechaNacimiento: new Date('2000-07-08'),
    password:        'Admin@12345'
  };

  // Modales
  modalEdicionVisible  = false;
  modalPasswordVisible = false;

  // Formulario edición
  formEdicion: any = {};

  // Formulario contraseña
  formPassword = { actual: '', nueva: '', confirmar: '' };
  erroresPassword: any = {};

  constructor(private messageService: MessageService) {}

  // Tabla de datos derivada del objeto usuario
  get datosUsuario() {
    return [
      { campo: 'Usuario',           valor: this.usuario.usuario,                          icon: 'pi pi-user' },
      { campo: 'Nombre completo',   valor: this.usuario.nombreCompleto,                   icon: 'pi pi-id-card' },
      { campo: 'Correo',            valor: this.usuario.email,                            icon: 'pi pi-envelope' },
      { campo: 'Teléfono',          valor: this.usuario.telefono,                         icon: 'pi pi-phone' },
      { campo: 'Dirección',         valor: this.usuario.direccion,                        icon: 'pi pi-map-marker' },
      { campo: 'Fecha nacimiento',  valor: this.usuario.fechaNacimiento.toLocaleDateString('es-MX'), icon: 'pi pi-calendar' },
    ];
  }

  abrirEdicion() {
    this.formEdicion = {
      usuario:         this.usuario.usuario,
      nombreCompleto:  this.usuario.nombreCompleto,
      email:           this.usuario.email,
      telefono:        this.usuario.telefono,
      direccion:       this.usuario.direccion,
      fechaNacimiento: this.usuario.fechaNacimiento
    };
    this.modalEdicionVisible = true;
  }

  guardarEdicion() {
    this.usuario = { ...this.usuario, ...this.formEdicion };
    this.modalEdicionVisible = false;
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Perfil actualizado correctamente' });
  }

  abrirCambioPassword() {
    this.formPassword    = { actual: '', nueva: '', confirmar: '' };
    this.erroresPassword = {};
    this.modalPasswordVisible = true;
  }

  guardarPassword() {
    this.erroresPassword = {};

    if (!this.formPassword.actual) {
      this.erroresPassword.actual = 'Ingresa tu contraseña actual';
    } else if (this.formPassword.actual !== this.usuario.password) {
      this.erroresPassword.actual = 'La contraseña actual es incorrecta';
    }

    const regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{10,}$/;
    if (!this.formPassword.nueva) {
      this.erroresPassword.nueva = 'Ingresa la nueva contraseña';
    } else if (!regex.test(this.formPassword.nueva)) {
      this.erroresPassword.nueva = 'Mínimo 10 caracteres, una mayúscula, un número y un símbolo';
    }

    if (this.formPassword.nueva !== this.formPassword.confirmar) {
      this.erroresPassword.confirmar = 'Las contraseñas no coinciden';
    }

    if (Object.keys(this.erroresPassword).length > 0) return;

    this.usuario.password = this.formPassword.nueva;
    this.modalPasswordVisible = false;
    this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Contraseña cambiada correctamente' });
  }
}