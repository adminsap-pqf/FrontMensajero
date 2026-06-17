import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ColectarElementosComponent } from './colectar-elementos.component';

const routes: Routes = [
  {
    path: '',
    component: ColectarElementosComponent,
    children: [
      {
        path: '',
        redirectTo: 'colectar-list',
        pathMatch: 'full',
      },
      {
        path: 'colectar-list',
        loadChildren: () =>
          import('./colectar-list/colectar-list.module').then(
            (m) => m.ColectarListModule,
          ),
      },
      {
        path: 'colectar-detalle',
        loadChildren: () =>
          import('./colectar-detalles/colectar-detalles.module').then(
            (m) => m.ColectarDetallesModule,
          ),
      },
      {
        path: 'colectar-escann',
        loadChildren: () =>
          import('./colectar-escann/colectar-escann.module').then(
            (m) => m.ColectarEscannModule,
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ColectarElementosRoutingModule {}
