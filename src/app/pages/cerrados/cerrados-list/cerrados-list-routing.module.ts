import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CerradosListComponent } from './cerrados-list.component';

const routes: Routes = [
  {
    path: '',
    component: CerradosListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CerradosListRoutingModule {}
