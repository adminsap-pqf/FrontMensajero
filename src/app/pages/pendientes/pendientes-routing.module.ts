import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PendientesComponent } from './pendientes.component';

const routes: Routes = [
  {
    path: '',
    component: PendientesComponent,
    children: [
      {
        path: '',
        redirectTo: 'pendientes-list',
        pathMatch: 'full',
      },
      {
        path: 'pendientes-list',
        loadChildren: () =>
          import('./pendientes-list/pendientes-list.module').then(
            (m) => m.PendientesListModule,
          ),
      },
      {
        path: 'pendientes-detalle',
        loadChildren: () =>
          import('./pendientes-detalle/pendientes-detalle.module').then(
            (m) => m.PendientesDetalleModule,
          ),
      },
      {
        path: 'pendientes-mapa',
        loadChildren: () =>
          import('./mapa/mapa.module').then((m) => m.MapaPageModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PendientesRoutingModule {}
