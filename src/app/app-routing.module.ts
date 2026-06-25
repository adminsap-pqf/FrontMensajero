import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccesoGuard } from '../providers/acceso/acceso.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'activacion',
    loadChildren: () =>
      import('./pages/activacion/activacion.module').then(
        (m) => m.ActivacionModule,
      ),
  },
  {
    path: 'login',
    canActivate: [AccesoGuard],
    loadChildren: () =>
      import('./pages/login/login.module').then((m) => m.LoginModule),
  },
  {
    path: 'tabs',
    canActivate: [AccesoGuard],
    loadChildren: () =>
      import('./components/tabs/tabs.module').then((m) => m.TabsModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
