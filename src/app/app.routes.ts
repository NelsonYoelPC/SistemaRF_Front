import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'administracion/usuarios',
        loadComponent: () =>
            import('./pages/usuarios/usuarios').then(m => m.UsuariosComponent)
    },
    {
        path: 'administracion/roles',
        loadComponent: () =>
            import('./pages/roles/roles').then(m => m.RolesComponent)
    }
    //,
    //{
    //    path: '',
    //    redirectTo: 'administracion/usuarios',
    //    pathMatch: 'full'
    //}
];