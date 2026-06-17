import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnCierreComponent } from './en-cierre.component';

const routes: Routes = [
  {
    path: '',
    component: EnCierreComponent,
    children: [
      {
        path: '',
        redirectTo: 'en-cierre-list',
        pathMatch: 'full',
      },
      {
        path: 'en-cierre-list',
        loadChildren: () =>
          import('./encierre-list/en-cierre-list.module').then(
            (m) => m.EnCierreListModule,
          ),
      },
      {
        path: 'en-cierre-detalle',
        loadChildren: () =>
          import(
            '../../pages/en-cierre/en-cierre-detalle/en-cierre-detalle.module'
          ).then((m) => m.EnCierreDetallePageModule),
      },
      {
        path: 'realizado',
        loadChildren: () =>
          import('../../pages/realizado/realizado.module').then(
            (m) => m.RealizadoPageModule,
          ),
      },
      {
        path: 'no-realizado',
        loadChildren: () =>
          import('../../pages/no-realizado/no-realizado.module').then(
            (m) => m.NoRealizadoPageModule,
          ),
      },
      {
        path: 'agregar-receptor',
        loadChildren: () =>
          import(
            '../../pages/realizado/agregar-receptor/agregar-receptor.module'
          ).then((m) => m.AgregarReceptorPageModule),
      },
      {
        path: 'cam-scann',
        loadChildren: () =>
          import('../cam-scan-content/cam-scan-content.module').then(
            (m) => m.CamScanContentPageModule,
          ),
      },
      {
        path: 'escann-docs',
        loadChildren: () =>
          import('../cam-scan-content/escann-docs/escann-docs.module').then(
            (m) => m.EscannDocsPageModule,
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EnCierreRoutingModule {}
