import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CerradosDetallePage } from './cerrados-detalle';

const routes: Routes = [
  {
    path: '',
    component: CerradosDetallePage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CerradosDetalleRoutingModule {}
