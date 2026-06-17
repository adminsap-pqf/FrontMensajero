import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PendientesComponent } from './pendientes.component';
import { PendientesRoutingModule } from './pendientes-routing.module';
import { IonicModule } from '@ionic/angular';
import { StorageProvider } from '../../../providers/storage/storage';

@NgModule({
  declarations: [PendientesComponent],
  imports: [CommonModule, PendientesRoutingModule, IonicModule],
  exports: [PendientesComponent],
  providers: [StorageProvider],
})
export class PendientesModule {}
