import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
import { SharedDataService } from '../shared/shared-data.service';
import { AuthService } from '../../core/services/auth.service';

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

  private readonly BASE = 'http://localhost:3000/api';

  datosUsuario: any[] = [];
  modalEdicionVisible = false;
  modalPasswordVisible = false;
  guardando = false;

formEdicion: FormEdicion = {
  nombreCompleto: '',
  usuario: '',
  email: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: null,
};
  formPassword = { actual: '', nueva: '', confirmar: '' };
  erroresPassword: any = {};

  constructor(
    private router: Router,
    private messageService: MessageService,
    public shared: SharedDataService,
    private auth: AuthService,
    private http: HttpClient,
  ) {}

  // Acceso directo al usuario del servicio compartido
  get usuario() {
    return this.shared.usuarioActual;
  }

  ngOnInit() {
    // Si usuarioActual ya está cargado, refrescar directo
    if (this.shared.usuarioActual) {
      this.refrescarTabla();
    } else {
      // Esperar a que inicializar() termine y luego refrescar
      this.shared.esperarListo().then(() => {
        this.refrescarTabla();
      });
    }
  }

  private headers(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getFormVacio(): FormEdicion {
    const u = this.shared?.usuarioActual;

    let fechaDate: Date | null = null;
    if (u?.fecha_nacimiento) {                                    // ← fecha_nacimiento
      const [y, m, d] = u.fecha_nacimiento.split('-').map(Number);
      fechaDate = new Date(y, m - 1, d);
    }

    return {
      nombreCompleto:  u?.nombre_completo ?? '',
      usuario:         u?.username        ?? '',
      email:           u?.email           ?? '',
      telefono:        u?.telefono        ?? '',
      direccion:       u?.direccion       ?? '',
      fechaNacimiento: fechaDate,
    };
  }

  refrescarTabla() {
    const u = this.shared.usuarioActual;
    if (!u) return;
    this.datosUsuario = [
      { campo: 'Usuario',          valor: u.username,          icon: 'pi pi-user' },
      { campo: 'Email',            valor: u.email,             icon: 'pi pi-envelope' },
      { campo: 'Teléfono',         valor: u.telefono,          icon: 'pi pi-phone' },
      { campo: 'Dirección',        valor: u.direccion,         icon: 'pi pi-map-marker' },
      { campo: 'Fecha nacimiento', valor: u.fecha_nacimiento ?? '—', icon: 'pi pi-calendar' },
      { campo: 'Último acceso',    valor: u.last_login ? new Date(u.last_login).toLocaleString('es-MX') : '—', icon: 'pi pi-clock' },
    ];
  }

  volver() {
    this.router.navigate(['/grupo']);
  }

  cerrarSesion() {
    this.auth.clearToken();
    localStorage.removeItem('erp_usuario');
    this.shared.reset();
    this.router.navigate(['/login']);
  }

  abrirEdicion() {
    this.formEdicion = this.getFormVacio();
    this.modalEdicionVisible = true;
  }

  guardarEdicion() {
    if (!this.shared.usuarioActual) return;
    this.guardando = true;

    const payload = {
      nombre_completo: this.formEdicion.nombreCompleto,
      username:        this.formEdicion.usuario,
      direccion:       this.formEdicion.direccion,
      telefono:        this.formEdicion.telefono,
      fecha_nacimiento: this.formEdicion.fechaNacimiento
        ? this.formEdicion.fechaNacimiento.toISOString().split('T')[0]
        : null,
    };

    this.http.patch<any>(
      `${this.BASE}/usuarios/${this.shared.usuarioActual.id}`,
      payload,
      { headers: this.headers() }
    ).subscribe({
      next: (res) => {
        this.guardando = false;
        const actualizado = res.data?.usuario;
        if (actualizado && this.shared.usuarioActual) {
          // ✅ Reasignar objeto completo para que Angular detecte el cambio
          this.shared.usuarioActual = {
            ...this.shared.usuarioActual,
            nombre_completo: actualizado.nombre_completo,
            username:        actualizado.username,
            telefono:        actualizado.telefono,
            direccion:       actualizado.direccion,
          };
        }
        this.refrescarTabla();
        this.modalEdicionVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Perfil actualizado correctamente' });
      },
      error: (err) => {
        this.guardando = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.data?.error ?? 'No se pudo actualizar el perfil' });
      }
    });
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

    // Llamar al endpoint de cambio de contraseña del gateway
    this.http.post(
      `${this.BASE}/change-password`,
      { password: this.formPassword.nueva, confirm_password: this.formPassword.confirmar, token: this.auth.getToken() },
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        this.modalPasswordVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Contraseña cambiada correctamente' });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.data?.error ?? 'No se pudo cambiar la contraseña' });
      }
    });
  }
}