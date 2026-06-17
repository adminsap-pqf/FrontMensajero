import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ColectarListComponent } from './colectar-list.component';

const routes: Routes = [
  {
    path: '',
    component: ColectarListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ColectarListRoutingModule {}
