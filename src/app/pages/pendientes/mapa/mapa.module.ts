import { NgModule } from '@angular/core';
import { MapaPage } from './mapa';
import { PendientesMapaRoutingModule } from './pendientes-mapa-routing.module';
import { MisRecorridosPageModule } from './mis-recorridos/mis-recorridos.module';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { StorageProvider } from '../../../../providers/storage/storage';

@NgModule({
  declarations: [MapaPage],
  imports: [
    CommonModule,
    PendientesMapaRoutingModule,
    MisRecorridosPageModule,
    IonicModule,
  ],
  exports: [MapaPage],
  providers: [StorageProvider],
})
export class MapaPageModule {}
