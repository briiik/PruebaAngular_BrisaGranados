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

export const routes: Routes = [
    { path: '',                      component: HomeComponent },
    { path: 'login',                 component: LoginComponent },
    { path: 'register',              component: RegisterComponent },
    { path: 'principal',             component: PrincipalComponent },
    { path: 'grupo',                 component: GrupoComponent },
    { path: 'grupo-dashboard/:id',   component: GrupoDashboardComponent },
    { path: 'usuario',               component: UsuarioComponent },
    { path: 'gestion-grupo/:id',     component: GestionGrupoComponent },
    { path: 'superadmin',            component: SuperadminComponent },
    { path: '**',                    redirectTo: '' }
];