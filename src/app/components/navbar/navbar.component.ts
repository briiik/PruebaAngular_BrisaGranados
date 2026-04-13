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
import { PermissionService } from '../../core/services/permission.service';

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

  // Solo cerrar sesión — el perfil ya está en el slidebar
  userMenuItems: MenuItem[] = [
    { label: 'Cerrar Sesión', icon: 'pi pi-sign-out', command: () => this.cerrarSesion() }
  ];

  constructor(
    private router: Router,
    public shared: SharedDataService,
    private auth: AuthService,
    private permission: PermissionService,
  ) {}

  cerrarSesion() {
    this.auth.clearToken();
    localStorage.removeItem('erp_usuario');
    localStorage.removeItem('pendingRegistration');
    this.permission.clear();
    this.shared.reset();
    this.router.navigate(['/login']);
  }
}