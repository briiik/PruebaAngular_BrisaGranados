import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MessageService } from 'primeng/api';

// PrimeNG
import { CardModule }       from 'primeng/card';
import { InputTextModule }  from 'primeng/inputtext';
import { IconFieldModule }  from 'primeng/iconfield';
import { InputIconModule }  from 'primeng/inputicon';
import { PasswordModule }   from 'primeng/password';
import { ButtonModule }     from 'primeng/button';
import { DividerModule }    from 'primeng/divider';
import { MessageModule }    from 'primeng/message';
import { ToastModule }      from 'primeng/toast';

// Servicio
import { AuthService } from '../../core/services/auth.service';
import { SharedDataService } from '../../components/shared/shared-data.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    CardModule, InputTextModule, IconFieldModule,
    InputIconModule, PasswordModule, ButtonModule,
    DividerModule, MessageModule, ToastModule
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  usuario  = '';
  password = '';
  error    = false;
  cargando = false;

  // Easter egg: 5 clicks en el logo
  private clickCount = 0;

  constructor(
    private authService:    AuthService,
    private messageService: MessageService,
    private router:         Router,
    private sharedData:     SharedDataService,
  ) {}

  login(): void {
    if (!this.usuario.trim() || !this.password.trim()) {
      this.error = true;
      return;
    }

    this.error    = false;
    this.cargando = true;

    this.authService.login({ email: this.usuario, password: this.password })
      .subscribe({
        next: (res) => {
          this.cargando = false;

          this.authService.saveToken(res.data.token);
          localStorage.setItem('erp_usuario', JSON.stringify({ id: res.data.usuario.id }));

          // ✅ Usar .then() en lugar de await para no necesitar async
          this.sharedData.reset();
          this.sharedData.inicializar().then(() => {
            this.messageService.add({
              severity: 'success',
              summary:  '¡Bienvenido!',
              detail:   `Hola, ${res.data.usuario.nombre_completo}`,
              life:     2000
            });
            setTimeout(() => this.router.navigate(['/grupo']), 1500);
          });
        },
        error: () => {
          this.cargando = false;
          this.error    = true;
        }
      });
  }

  // Easter egg requerido en el documento (5 clicks en logo → alerta)
  onLogoClick(): void {
    this.clickCount++;
    if (this.clickCount >= 5) {
      this.clickCount = 0;
      this.messageService.add({
        severity: 'warn',
        summary:  'catch u',
        life:     3000
      });
    }
  }
}