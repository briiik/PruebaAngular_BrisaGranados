import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { SlidebarComponent } from '../slidebar/slidebar.component';
import { SharedDataService } from '../shared/shared-data.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    ToolbarModule,
    ButtonModule,
    AvatarModule,
    MenuModule,
    ToastModule,
    SlidebarComponent,
  ],
  providers: [MessageService],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {

  @Input() titulo: string = '';

  sidebarVisible = false;

  get usuario(): string {
    return this.shared.usuarioActivoNombre;
  }

  userMenuItems: MenuItem[] = [
    { label: 'Perfil', icon: 'pi pi-user', routerLink: ['/usuario'] },
    { separator: true },
    { label: 'Cerrar Sesión', icon: 'pi pi-sign-out', command: () => this.cerrarSesion() }
  ];

  constructor(
    private router: Router,
    public shared: SharedDataService,
    private auth: AuthService, // ✅ Inyectar AuthService
  ) {}

  cerrarSesion() {
    // ✅ Corregido: el token está en una cookie, no en localStorage
    this.auth.clearToken();
    localStorage.removeItem('usuarioActual'); // por si guardas datos extra aquí
    this.router.navigate(['/login']);
  }
}