import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnCierreDetallePage } from './en-cierre-detalle';

const routes: Routes = [
  {
    path: '',
    component: EnCierreDetallePage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EnCierreDetalleRoutingModule {}
