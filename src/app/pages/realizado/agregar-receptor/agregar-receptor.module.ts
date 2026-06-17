import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { AgregarReceptorPage } from './agregar-receptor';

const routes: Routes = [
  {
    path: '',
    component: AgregarReceptorPage,
  },
];

@NgModule({
  declarations: [AgregarReceptorPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  exports: [AgregarReceptorPage],
})
export class AgregarReceptorPageModule {}
