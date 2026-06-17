import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColectarEscannComponent } from './colectar-escann.component';
import { ColectarEscannRoutingModule } from './colectar-escann-routing.module';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [ColectarEscannComponent],
  imports: [CommonModule, ColectarEscannRoutingModule, IonicModule],
  exports: [ColectarEscannComponent],
})
export class ColectarEscannModule {}
