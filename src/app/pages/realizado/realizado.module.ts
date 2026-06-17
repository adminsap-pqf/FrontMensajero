import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { RealizadoPage } from './realizado';

const routes: Routes = [
  {
    path: '',
    component: RealizadoPage,
  },
];

@NgModule({
  declarations: [RealizadoPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  exports: [RealizadoPage],
})
export class RealizadoPageModule {}
