import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CerradosDetalleRoutingModule } from './cerrados-detalle-routing.module';
import { IonicModule } from '@ionic/angular';
import { CerradosDetallePage } from './cerrados-detalle';

@NgModule({
  declarations: [CerradosDetallePage],
  imports: [CommonModule, IonicModule, CerradosDetalleRoutingModule],
  exports: [CerradosDetallePage],
})
export class CerradosDetalleModule {}
