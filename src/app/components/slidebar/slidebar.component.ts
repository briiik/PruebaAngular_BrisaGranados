import { Component, Input, Output, EventEmitter, OnInit, DoCheck } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedDataService } from '../shared/shared-data.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-slidebar',
  templateUrl: './slidebar.component.html',
  styleUrls: ['./slidebar.component.css'],
  standalone: true,
  imports: [DrawerModule, MenuModule, RouterModule, CommonModule]
})
export class SlidebarComponent implements OnInit, DoCheck {

  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  menuItems: MenuItem[] = [];
  private ultimoUsuario = '';

  constructor(
    public shared: SharedDataService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.reconstruirMenu();
    this.ultimoUsuario = this.shared.usuarioActivoNombre;
  }

  ngDoCheck() {
    if (this.shared.usuarioActivoNombre !== this.ultimoUsuario) {
      this.ultimoUsuario = this.shared.usuarioActivoNombre;
      this.reconstruirMenu();
    }
  }

  reconstruirMenu() {
    const logueado = this.auth.isLoggedIn();

    this.menuItems = [
      // Solo mostrar estas opciones si NO hay sesión iniciada
      ...(!logueado ? [
        { label: 'Home',             icon: 'pi pi-home',      routerLink: ['/'] },
        { label: 'Inicio de Sesión', icon: 'pi pi-sign-in',   routerLink: ['/login'] },
        { label: 'Registro',         icon: 'pi pi-user-plus', routerLink: ['/register'] },
        { separator: true },
      ] : []),

      // Siempre visible si está logueado
      ...(logueado ? [
        { label: 'Mis Grupos', icon: 'pi pi-users', routerLink: ['/grupo'] },
      ] : []),

      ...(this.shared.tienePerm('group:view') ? [
        { label: 'Gestión de grupo', icon: 'pi pi-cog', routerLink: ['/gestion-grupo'] },
      ] : []),

      ...(this.shared.tienePerm('admin:users') ? [
        { separator: true },
        { label: 'Superadmin', icon: 'pi pi-shield', routerLink: ['/superadmin'] },
      ] : []),

      ...(logueado ? [
        { separator: true },
        { label: 'Usuario', icon: 'pi pi-id-card', routerLink: ['/usuario'] },
      ] : []),
    ];
  }

  onVisibleChange(value: boolean) {
    this.visibleChange.emit(value);
  }
}