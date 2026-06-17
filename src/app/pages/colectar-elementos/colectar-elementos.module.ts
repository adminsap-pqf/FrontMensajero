import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColectarElementosComponent } from './colectar-elementos.component';
import { ColectarElementosRoutingModule } from './colectar-elementos-routing.module';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [ColectarElementosComponent],
  imports: [CommonModule, ColectarElementosRoutingModule, IonicModule],
  exports: [ColectarElementosComponent],
})
export class ColectarElementosModule {}
