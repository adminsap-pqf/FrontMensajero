import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnCierreListComponent } from './en-cierre-list.component';

const routes: Routes = [
  {
    path: '',
    component: EnCierreListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EnCierreListRoutingModule {}
