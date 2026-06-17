import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PendientesListRoutingModule } from './pendientes-list-routing.module';
import { IonicModule } from '@ionic/angular';
import { PendientesListComponent } from './pendientes-list.component';
import { StorageProvider } from '../../../../providers/storage/storage';

@NgModule({
  declarations: [PendientesListComponent],
  imports: [CommonModule, PendientesListRoutingModule, IonicModule],
  exports: [PendientesListComponent],
  providers: [StorageProvider],
})
export class PendientesListModule {}
