import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ColectarDetallesComponent } from './colectar-detalles.component';

const routes: Routes = [
  {
    path: '',
    component: ColectarDetallesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ColectarDetallesRoutingModule {}
