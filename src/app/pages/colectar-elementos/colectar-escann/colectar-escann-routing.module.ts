import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ColectarEscannComponent } from './colectar-escann.component';

const routes: Routes = [
  {
    path: '',
    component: ColectarEscannComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ColectarEscannRoutingModule {}
