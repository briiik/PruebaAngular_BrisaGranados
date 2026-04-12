import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';

// PrimeNG
import { ToastModule }      from 'primeng/toast';
import { CardModule }       from 'primeng/card';
import { InputTextModule }  from 'primeng/inputtext';
import { IconFieldModule }  from 'primeng/iconfield';
import { InputIconModule }  from 'primeng/inputicon';
import { PasswordModule }   from 'primeng/password';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule }     from 'primeng/button';
import { DividerModule }    from 'primeng/divider';

// Servicio
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ToastModule, CardModule, InputTextModule,
    IconFieldModule, InputIconModule, PasswordModule,
    DatePickerModule, ButtonModule, DividerModule
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrls:   ['./register.component.css']
})
export class RegisterComponent {

  form = {
    usuario:         '',
    email:           '',
    password:        '',
    confirmPassword: '',
    nombreCompleto:  '',
    direccion:       '',
    fechaNacimiento: null as Date | null,
    telefono:        ''
  };

  errores: any = {};
  cargando = false;

  constructor(
    private authService:    AuthService,
    private messageService: MessageService,
    private router:         Router
  ) {}

  // ── Helpers de validación ───────────────────────────────────────────────────
  private get passwordRegex() {
    return /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{10,}$/;
  }

  private esMayorDeEdad(fecha: Date): boolean {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) edad--;
    return edad >= 18;
  }

  private validar(): boolean {
    this.errores = {};
    const f = this.form;

    if (!f.usuario.trim())
      this.errores.usuario = 'El usuario es requerido';

    if (!f.email.trim() || !f.email.includes('@'))
      this.errores.email = 'Email inválido';

    if (!f.nombreCompleto.trim())
      this.errores.nombreCompleto = 'El nombre completo es requerido';

    if (!f.direccion.trim())
      this.errores.direccion = 'La dirección es requerida';

    if (!f.password) {
      this.errores.password = 'La contraseña es requerida';
    } else if (!this.passwordRegex.test(f.password)) {
      this.errores.password = 'Mínimo 10 caracteres, una mayúscula, un número y un símbolo (!@#$%^&*)';
    }

    if (f.password !== f.confirmPassword)
      this.errores.confirmPassword = 'Las contraseñas no coinciden';

    if (!f.fechaNacimiento) {
      this.errores.fechaNacimiento = 'La fecha de nacimiento es requerida';
    } else if (!this.esMayorDeEdad(f.fechaNacimiento)) {
      this.errores.fechaNacimiento = 'Debes ser mayor de edad para registrarte';
    }

    const telefonoLimpio = f.telefono.replace(/\D/g, '');
    if (!telefonoLimpio || telefonoLimpio.length < 10)
      this.errores.telefono = 'Ingresa un número de teléfono válido (10 dígitos)';

    return Object.keys(this.errores).length === 0;
  }

  // ── Envío al backend ─────────────────────────────────────────────────────────
  registrar(): void {
    if (!this.validar()) return;

    this.cargando = true;

    const fecha = this.form.fechaNacimiento!;
    const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

    this.authService.register({
      username:         this.form.usuario,
      email:            this.form.email,
      password:         this.form.password,
      confirm_password: this.form.confirmPassword,
      nombre_completo:  this.form.nombreCompleto,
      direccion:        this.form.direccion,
      telefono:         this.form.telefono,
      fecha_nacimiento: fechaStr
    }).subscribe({
      next: (res) => {
        this.cargando = false;
        this.messageService.add({
          severity: 'success',
          summary:  '¡Registro exitoso!',
          detail:   `Bienvenido, ${this.form.nombreCompleto}`,
          life:     3000
        });
        // Redirige al login después de 2 s
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.cargando = false;
        const data = err.error?.data;

        // Si el backend devuelve errores por campo, los asignamos
        if (data?.errores) {
          const e = data.errores;
          if (e.username)         this.errores.usuario         = e.username;
          if (e.email)            this.errores.email            = e.email;
          if (e.nombre_completo)  this.errores.nombreCompleto   = e.nombre_completo;
          if (e.direccion)        this.errores.direccion        = e.direccion;
          if (e.password)         this.errores.password         = e.password;
          if (e.confirm_password) this.errores.confirmPassword  = e.confirm_password;
          if (e.fecha_nacimiento) this.errores.fechaNacimiento  = e.fecha_nacimiento;
          if (e.telefono)         this.errores.telefono         = e.telefono;
        } else {
          // Error genérico
          this.messageService.add({
            severity: 'error',
            summary:  'Error al registrarse',
            detail:   data?.error ?? 'Intenta de nuevo más tarde',
            life:     4000
          });
        }
      }
    });
  }
}