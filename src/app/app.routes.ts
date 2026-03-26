import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'administracion/usuarios',
        loadComponent: () =>
            import('./pages/usuarios/usuarios').then(m => m.UsuariosComponent)
    }
    //,
    //{
    //    path: '',
    //    redirectTo: 'administracion/usuarios',
    //    pathMatch: 'full'
    //}
];