import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CerradosComponent } from './cerrados.component';
import { CerradosRoutingModule } from './cerrados-routing.module';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [CerradosComponent],
  imports: [CommonModule, IonicModule, CerradosRoutingModule],
  exports: [CerradosComponent],
})
export class CerradosModule {}
