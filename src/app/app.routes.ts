import { Routes } from '@angular/router';
import { HomeComponent } from '../app/pages/home/home.component';
import { LoginComponent } from '../app/pages/login/login.component';
import { RegisterComponent } from '../app/pages/register/register.component';
import { PrincipalComponent } from './components/principal/principal.component';
import { GrupoComponent } from './components/grupo/grupo.component';
import { UsuarioComponent } from './components/usuario/usuario.component';
import { GrupoDashboardComponent } from './components/grupo-dashboard/grupo-dashboard.component';
import { GestionGrupoComponent } from './components/gestion-grupo/gestion-grupo.component';
import { SuperadminComponent } from './components/superadmin/superadmin.component';
import { AccesoDenegadoComponent } from './components/acceso-denegado/acceso-denegado.component'; // 👈
import { permGuard } from './components/shared/auth.guard'; // 👈

export const routes: Routes = [
  { path: '',         component: HomeComponent },
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'principal', component: PrincipalComponent },

  { path: 'grupo',
  component: GrupoComponent },

  { path: 'grupo-dashboard/:id',
    component: GrupoDashboardComponent,
    canActivate: [permGuard('group:view')] },

  { path: 'gestion-grupo/:id',
    component: GestionGrupoComponent,
    canActivate: [permGuard('group:view')] },

  { path: 'usuario',
    component: UsuarioComponent },

  { path: 'superadmin',
    component: SuperadminComponent,
    canActivate: [permGuard('admin:users')] },

  { path: 'acceso-denegado',
    component: AccesoDenegadoComponent }, // 👈

  { path: '**', redirectTo: '' }
];