import { Injectable } from '@angular/core';
import { group } from '@primeng/themes/aura/avatar';

// ── Permisos disponibles en el sistema ────────────────────────────────────────
export const TODOS_LOS_PERMISOS = [
  // Tickets
  { clave: 'ticket:view',    label: 'Ver tickets',       grupo: 'Tickets' },
  { clave: 'ticket:create',  label: 'Crear tickets',     grupo: 'Tickets' },
  { clave: 'ticket:edit',    label: 'Editar tickets',    grupo: 'Tickets' },
  { clave: 'ticket:delete',  label: 'Eliminar tickets',  grupo: 'Tickets' },
  { clave: 'ticket:assign',  label: 'Asignar tickets',   grupo: 'Tickets' },
  // Grupo
  { clave: 'group:view',     label: 'Ver grupo',         grupo: 'Grupo' },
  { clave: 'group:edit',     label: 'Editar grupo',      grupo: 'Grupo' },
  { clave: 'group:add',      label: 'Agregar miembros',  grupo: 'Grupo' },
  { clave: 'group:delete',   label: 'Eliminar miembros', grupo: 'Grupo' },
  // Admin
  { clave: 'admin:users',    label: 'Gestionar usuarios',grupo: 'Admin' },
  { clave: 'admin:perms',    label: 'Gestionar permisos',grupo: 'Admin' },
];

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  permisos: string[];   // lista de claves de permiso
  fechaCreacion: string;
}

// Datos compartidos entre componentes (simulación de store/servicio)
@Injectable({ providedIn: 'root' })
export class SharedDataService {

  usuarios: Usuario[] = [
    {
      id: 1, nombre: 'Brisa', email: 'brisa@mail.com', activo: true,
      fechaCreacion: '2025-01-01',
      permisos: ['ticket:view','ticket:create','ticket:edit','ticket:delete','ticket:assign',
                 'group:view','group:edit','group:add','group:delete','admin:users','admin:perms'],
    },
    {
      id: 2, nombre: 'Jonathan', email: 'jonathan@mail.com', activo: true,
      fechaCreacion: '2025-01-03',
      permisos: ['ticket:view','ticket:create','ticket:edit','ticket:assign','group:view', 'admin:users','admin:perms',
        'group:add', 'group:edit'
      ],
    },
    {
      id: 3, nombre: 'Ana', email: 'ana@mail.com', activo: false,
      fechaCreacion: '2025-01-05',
      permisos: ['ticket:view','group:view'],
    },
    {
      id: 4, nombre: 'Carlos', email: 'carlos@mail.com', activo: true,
      fechaCreacion: '2025-01-10',
      permisos: ['ticket:view','ticket:create','group:view'],
    },
  ];

  // Usuario activo actual (simulado)
  usuarioActivoNombre = 'Brisa';

  get usuarioActivo(): Usuario {
    return this.usuarios.find(u => u.nombre === this.usuarioActivoNombre)!;
  }

  tienePerm(clave: string): boolean {
    return this.usuarioActivo?.permisos.includes(clave) ?? false;
  }
}