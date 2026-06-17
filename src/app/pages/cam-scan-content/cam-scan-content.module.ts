import { NgModule } from '@angular/core';
import { CamScanContentPage } from './cam-scan-content';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

const routes: Routes = [
  {
    path: '',
    component: CamScanContentPage,
  },
];

@NgModule({
  declarations: [CamScanContentPage],
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
  exports: [CamScanContentPage],
})
export class CamScanContentPageModule {}
