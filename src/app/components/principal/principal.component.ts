import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';

// PrimeNG Modules
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Tu componente sidebar
import { SlidebarComponent } from '../slidebar/slidebar.component';

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToolbarModule,
    ButtonModule,
    AvatarModule,
    MenuModule,
    CardModule,
    TagModule,
    DividerModule,
    ToastModule,
    SlidebarComponent
  ],
  providers: [MessageService],
  templateUrl: './principal.component.html',
  styleUrls: ['./principal.component.css']
})
export class PrincipalComponent implements OnInit {
  usuario = '';
  sidebarVisible = false;

  userMenuItems: MenuItem[] = [
    {
      label: 'Perfil',
      icon: 'pi pi-user'
    },
    {
      separator: true
    },
    {
      label: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      command: () => this.cerrarSesion()
    }
  ];

  constructor(private router: Router, private messageService: MessageService) {}

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { usuario?: string };
    if (state?.usuario) {
      this.usuario = state.usuario;
      localStorage.setItem('usuarioActual', state.usuario);
    } else {
      this.usuario = localStorage.getItem('usuarioActual') || 'Usuario';
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Bienvenido',
      detail: `Hola, ${this.usuario}!`
    });
  }

  cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    this.router.navigate(['/login']);
  }
}