import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PendientesDetalleComponent } from './pendientes-detalle.component';

const routes: Routes = [
  {
    path: '',
    component: PendientesDetalleComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PendientesDetalleRoutingModule {}
