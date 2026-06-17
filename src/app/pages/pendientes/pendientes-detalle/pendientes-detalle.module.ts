import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PendientesDetalleComponent } from './pendientes-detalle.component';
import { PendientesDetalleRoutingModule } from './pendientes-detalle-routing.module';

@NgModule({
  declarations: [PendientesDetalleComponent],
  imports: [CommonModule, PendientesDetalleRoutingModule, IonicModule],
  exports: [PendientesDetalleComponent],
})
export class PendientesDetalleModule {}
