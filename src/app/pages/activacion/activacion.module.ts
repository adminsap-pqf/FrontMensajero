import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivacionComponent } from './activacion.component';
import { ActivacionRoutingModule } from './activacion-routing.module';

@NgModule({
  declarations: [ActivacionComponent],
  imports: [IonicModule, CommonModule, FormsModule, ActivacionRoutingModule],
  exports: [ActivacionComponent],
})
export class ActivacionModule {}
