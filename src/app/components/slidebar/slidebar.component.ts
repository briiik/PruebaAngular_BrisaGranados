import { Component, Input, Output, EventEmitter, OnInit, DoCheck } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedDataService } from '../shared/shared-data.service';

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
  private ultimoUsuario = '';  // para detectar cambio de usuario

  constructor(public shared: SharedDataService) {}

  ngOnInit() {
    this.reconstruirMenu();
    this.ultimoUsuario = this.shared.usuarioActivoNombre;
  }

  // Solo reconstruye el menu si cambió el usuario activo
  ngDoCheck() {
    if (this.shared.usuarioActivoNombre !== this.ultimoUsuario) {
      this.ultimoUsuario = this.shared.usuarioActivoNombre;
      this.reconstruirMenu();
    }
  }

  reconstruirMenu() {
    this.menuItems = [
      { label: 'Home',             icon: 'pi pi-home',      routerLink: ['/'] },
      { label: 'Inicio de Sesión', icon: 'pi pi-sign-in',   routerLink: ['/login'] },
      { label: 'Registro',         icon: 'pi pi-user-plus', routerLink: ['/register'] },
      { separator: true },
      { label: 'Grupos',           icon: 'pi pi-users',     routerLink: ['/grupos'] },

      ...(this.shared.tienePerm('group:view') ? [
        { label: 'Gestión de grupo', icon: 'pi pi-cog', routerLink: ['/gestion-grupo'] },
      ] : []),

      ...(this.shared.tienePerm('ticket:view') ? [
        { separator: true },
        { label: 'Tickets', icon: 'pi pi-ticket', routerLink: ['/tickets'] },
      ] : []),

      ...(this.shared.tienePerm('admin:users') ? [
        { separator: true },
        { label: 'Superadmin', icon: 'pi pi-shield', routerLink: ['/superadmin'] },
      ] : []),

      { separator: true },
      { label: 'Usuario', icon: 'pi pi-id-card', routerLink: ['/usuario'] },
    ];
  }

  onVisibleChange(value: boolean) {
    this.visibleChange.emit(value);
  }
}