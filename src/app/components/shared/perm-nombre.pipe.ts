import { Pipe, PipeTransform } from '@angular/core';
import { Permiso } from './shared-data.service';

@Pipe({ name: 'permNombre', standalone: true })
export class PermNombrePipe implements PipeTransform {
  transform(permisos: Permiso[], uuid: string): string {
    return permisos.find(p => p.id === uuid)?.nombre ?? uuid;
  }
}