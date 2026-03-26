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
import { SharedDataService } from '../shared/shared-data.service'; // 👈 agregar

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
    return this.shared.usuarioActivoNombre; // 👈 cambiar esto también
  }

  userMenuItems: MenuItem[] = [
    { label: 'Perfil', icon: 'pi pi-user', routerLink: ['/usuario'] },
    { separator: true },
    { label: 'Cerrar Sesión', icon: 'pi pi-sign-out', command: () => this.cerrarSesion() }
  ];

  constructor(
    private router: Router,
    public shared: SharedDataService, // 👈 agregar
  ) {}

  cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    this.router.navigate(['/login']);
  }
}