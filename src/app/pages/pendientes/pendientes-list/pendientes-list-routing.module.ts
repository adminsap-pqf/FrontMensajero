import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PendientesListComponent } from './pendientes-list.component';

const routes: Routes = [
  {
    path: '',
    component: PendientesListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PendientesListRoutingModule {}
