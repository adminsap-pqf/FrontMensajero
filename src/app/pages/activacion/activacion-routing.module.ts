import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActivacionComponent } from './activacion.component';

const routes: Routes = [
  {
    path: '',
    component: ActivacionComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ActivacionRoutingModule {}
