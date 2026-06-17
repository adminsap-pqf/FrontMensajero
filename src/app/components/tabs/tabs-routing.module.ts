import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsComponent } from './tabs.component';

const routes: Routes = [
  {
    path: '',
    component: TabsComponent,
    children: [
      {
        path: '',
        redirectTo: 'colectar',
        pathMatch: 'full',
      },
      {
        path: 'colectar',
        loadChildren: () =>
          import(
            '../../pages/colectar-elementos/colectar-elementos.module'
          ).then((m) => m.ColectarElementosModule),
      },
      {
        path: 'pendientes',
        loadChildren: () =>
          import('../../pages/pendientes/pendientes.module').then(
            (m) => m.PendientesModule,
          ),
      },
      {
        path: 'en-cierre',
        loadChildren: () =>
          import('../../pages/en-cierre/en-cierre.module').then(
            (m) => m.EnCierreModule,
          ),
      },
      {
        path: 'cerrados',
        loadChildren: () =>
          import('../../pages/cerrados/cerrados.module').then(
            (m) => m.CerradosModule,
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsRoutingModule {}
