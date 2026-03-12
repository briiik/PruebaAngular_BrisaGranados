import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
export class SlidebarComponent implements OnInit {

  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  menuItems: MenuItem[] = [];

  constructor(public shared: SharedDataService) {}

  ngOnInit() {
    this.menuItems = [
      { label: 'Home',             icon: 'pi pi-home',      routerLink: ['/'] },
      { label: 'Inicio de Sesión', icon: 'pi pi-sign-in',   routerLink: ['/login'] },
      { label: 'Registro',         icon: 'pi pi-user-plus', routerLink: ['/register'] },
      { separator: true },
      { label: 'Grupos',           icon: 'pi pi-users',     routerLink: ['/grupos'] },

      ...(this.shared.tienePerm('admin:users') ? [
        { separator: true },
        {
          label: 'Superadmin',
          icon: 'pi pi-shield',
          routerLink: ['/superadmin'],
        },
      ] : []),

      { separator: true },
      { label: 'Usuario', icon: 'pi pi-id-card', routerLink: ['/usuario'] },
    ];
  }

  onVisibleChange(value: boolean) {
    this.visibleChange.emit(value);
  }
}