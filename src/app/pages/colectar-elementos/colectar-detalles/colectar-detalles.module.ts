import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColectarDetallesComponent } from './colectar-detalles.component';
import { ColectarDetallesRoutingModule } from './colectar-detalles-routing.module';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [ColectarDetallesComponent],
  imports: [CommonModule, ColectarDetallesRoutingModule, IonicModule],
  exports: [ColectarDetallesComponent],
})
export class ColectarDetallesModule {}
