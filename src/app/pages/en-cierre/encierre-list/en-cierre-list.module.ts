import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnCierreListComponent } from './en-cierre-list.component';
import { EnCierreListRoutingModule } from './en-cierre-list-routing.module';
import { IonicModule } from '@ionic/angular';
import { StorageProvider } from '../../../../providers/storage/storage';

@NgModule({
  declarations: [EnCierreListComponent],
  imports: [CommonModule, EnCierreListRoutingModule, IonicModule],
  exports: [EnCierreListComponent],
  providers: [StorageProvider],
})
export class EnCierreListModule {}
