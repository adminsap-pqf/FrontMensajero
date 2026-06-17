import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CerradosComponent } from './cerrados.component';

const routes: Routes = [
  {
    path: '',
    component: CerradosComponent,
    children: [
      {
        path: '',
        redirectTo: 'cerrados-list',
        pathMatch: 'full',
      },
      {
        path: 'cerrados-list',
        loadChildren: () =>
          import('./cerrados-list/cerrados-list.module').then(
            (m) => m.CerradosListModule,
          ),
      },
      {
        path: 'cerrados-detalle',
        loadChildren: () =>
          import('./cerrados-detalle/cerrados-detalle.module').then(
            (m) => m.CerradosDetalleModule,
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CerradosRoutingModule {}
