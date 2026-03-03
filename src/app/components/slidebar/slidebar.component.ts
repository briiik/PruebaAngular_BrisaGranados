import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-slidebar',
  templateUrl: './slidebar.component.html',
  styleUrls: ['./slidebar.component.css'],
  standalone: true,
  imports: [DrawerModule, MenuModule, RouterModule]
})
export class SlidebarComponent {

  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  onVisibleChange(value: boolean) {
    this.visible = value;
    this.visibleChange.emit(value);
  }

  menuItems: MenuItem[] = [
    { label: 'Home',           icon: 'pi pi-home',       routerLink: ['/'] },
    { label: 'Inicio de Sesión', icon: 'pi pi-sign-in',  routerLink: ['/login'] },
    { label: 'Registro',       icon: 'pi pi-user-plus',  routerLink: ['/register'] },
    { separator: true },
    { label: 'Grupo',          icon: 'pi pi-users',      routerLink: ['/grupo'] },
    { label: 'Usuario',        icon: 'pi pi-id-card',    routerLink: ['/usuario'] }
  ];
}