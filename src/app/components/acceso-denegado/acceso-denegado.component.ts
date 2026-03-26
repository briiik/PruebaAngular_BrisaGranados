import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { NavbarComponent } from '../navbar/navbar.component';
import { SharedDataService } from '../shared/shared-data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [ButtonModule, NavbarComponent, CommonModule, FormsModule, SelectModule],
  template: `
    <app-navbar titulo="Acceso Denegado"></app-navbar>
    <div style="display:flex; flex-direction:column; align-items:center;
                justify-content:center; height:80vh; gap:1.5rem; text-align:center;">
      <i class="pi pi-lock" style="font-size:4rem; color:#EF4444;"></i>
      <h2 style="margin:0;">Acceso Denegado</h2>
      <p style="color:#888; margin:0;">
        El usuario <strong>{{ shared.usuarioActivoNombre }}</strong>
        no tiene permisos para ver esa página.
      </p>

      <!-- Selector para cambiar de usuario desde aquí -->
      

      <div style="display:flex; gap:1rem; flex-wrap:wrap; justify-content:center;">
        
        <p-button label="Volver" icon="pi pi-arrow-left"
          severity="secondary" (onClick)="volver()">
        </p-button>
      </div>
    </div>
  `,
})
export class AccesoDenegadoComponent {
  constructor(public shared: SharedDataService, private router: Router) {}

  irAGrupos() { this.router.navigate(['/grupo']); }
  volver()    { window.history.back(); }
}