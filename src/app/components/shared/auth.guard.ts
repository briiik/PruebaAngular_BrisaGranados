import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SharedDataService } from './shared-data.service';

export const permGuard = (permiso: string): CanActivateFn => {
  return async () => {
    const shared = inject(SharedDataService);
    const router = inject(Router);
    await shared.esperarListo();  // ← esta línea es la clave
    if (shared.tienePerm(permiso)) return true;
    router.navigate(['/acceso-denegado']);
    return false;
  };
};