import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastModule],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  form = {
    usuario: '',
    email: '',
    password: '',
    confirmPassword: '',
    nombreCompleto: '',
    direccion: '',
    fechaNacimiento: '',
    telefono: ''
  };

  errores: any = {};

  // Toggle de visibilidad de contraseñas
  mostrarPassword = false;
  mostrarConfirmPassword = false;

  constructor(private messageService: MessageService) {}

  get passwordRegex() {
    return /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{10,}$/;
  }

  esMayorDeEdad(fecha: string): boolean {
    const hoy = new Date();
    const nacimiento = new Date(fecha);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad >= 18;
  }

  validar(): boolean {
    this.errores = {};
    const f = this.form;

    if (!f.usuario.trim()) this.errores.usuario = 'El usuario es requerido';
    if (!f.email.trim() || !f.email.includes('@')) this.errores.email = 'Email inválido';
    if (!f.nombreCompleto.trim()) this.errores.nombreCompleto = 'El nombre completo es requerido';
    if (!f.direccion.trim()) this.errores.direccion = 'La dirección es requerida';

    if (!f.password) {
      this.errores.password = 'La contraseña es requerida';
    } else if (!this.passwordRegex.test(f.password)) {
      this.errores.password = 'Mínimo 10 caracteres, una mayúscula, un número y un símbolo (!@#$%^&*)';
    }

    if (f.password !== f.confirmPassword) {
      this.errores.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!f.fechaNacimiento) {
      this.errores.fechaNacimiento = 'La fecha de nacimiento es requerida';
    } else if (!this.esMayorDeEdad(f.fechaNacimiento)) {
      this.errores.fechaNacimiento = 'Debes ser mayor de edad para registrarte';
    }

    const telefonoLimpio = f.telefono.replace(/\D/g, '');
    if (!telefonoLimpio || telefonoLimpio.length < 10) {
      this.errores.telefono = 'Ingresa un número de teléfono válido (10 dígitos)';
    }

    return Object.keys(this.errores).length === 0;
  }

  registrar() {
    if (this.validar()) {
      this.messageService.add({
        severity: 'success',
        summary: '¡Registro exitoso!',
        detail: `Bienvenido, ${this.form.nombreCompleto}`,
        life: 4000
      });
    }
  }
}