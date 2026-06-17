import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { EnCierreDetallePage } from './en-cierre-detalle';
import { EnCierreDetalleRoutingModule } from './en-cierre-detalle-routing.module';

@NgModule({
  declarations: [EnCierreDetallePage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EnCierreDetalleRoutingModule,
  ],
  exports: [EnCierreDetallePage],
})
export class EnCierreDetallePageModule {}
