import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-grupo',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    DividerModule,
    TableModule,
    ToastModule
  ],
  templateUrl: './grupo.component.html',
  styleUrls: ['./grupo.component.css']
})
export class GrupoComponent {

  alumnos = [
    { id: 1,  nombre: 'Brisa',       matricula: '2018140039', promedio: 9.2, estado: 'Regular' },
    { id: 2,  nombre: 'Jonathan',    matricula: '2022150023', promedio: 8.5, estado: 'Regular' },
    { id: 3,  nombre: 'Irving',      matricula: '2023170228', promedio: 7.8, estado: 'Irregular' },
    { id: 4,  nombre: 'Zekken',     matricula: '2023879245', promedio: 9.0, estado: 'Regular' },
  ];
}