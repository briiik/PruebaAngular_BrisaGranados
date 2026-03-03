import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    AvatarModule,
    TagModule,
    DividerModule,
    TableModule,
    ButtonModule,
    ToastModule
  ],
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.css']
})
export class UsuarioComponent {

  datosUsuario = [
    { campo: 'Nombre completo', valor: 'Ana García López',         icon: 'pi pi-user' },
    { campo: 'Matrícula',       valor: 'IDGS001',                   icon: 'pi pi-id-card' },
    { campo: 'Correo',          valor: 'ana.garcia@uteq.edu.mx',    icon: 'pi pi-envelope' },
    { campo: 'Teléfono',        valor: '+52 442 123 4567',          icon: 'pi pi-phone' },
    { campo: 'Grupo',           valor: 'IDGS14',                    icon: 'pi pi-users' },
    { campo: 'Semestre',        valor: '4°',                        icon: 'pi pi-book' },
    { campo: 'Rol',             valor: 'Administrador',             icon: 'pi pi-shield' },
    { campo: 'Fecha de alta',   valor: '01/08/2023',                icon: 'pi pi-calendar' },
  ];
}