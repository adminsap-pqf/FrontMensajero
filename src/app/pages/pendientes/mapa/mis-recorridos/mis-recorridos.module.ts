import { NgModule } from '@angular/core';
import { MisRecorridosPage } from './mis-recorridos';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [MisRecorridosPage],
  imports: [CommonModule, IonicModule],
  exports: [MisRecorridosPage],
})
export class MisRecorridosPageModule {}
