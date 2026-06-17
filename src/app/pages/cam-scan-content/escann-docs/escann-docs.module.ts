import { NgModule } from '@angular/core';

import { EscannDocsPage } from './escann-docs';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

const routes: Routes = [
  {
    path: '',
    component: EscannDocsPage,
  },
];

@NgModule({
  declarations: [EscannDocsPage],
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
  exports: [EscannDocsPage],
})
export class EscannDocsPageModule {}
