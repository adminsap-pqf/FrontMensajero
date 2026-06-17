import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CerradosListComponent } from './cerrados-list.component';
import { CerradosListRoutingModule } from './cerrados-list-routing.module';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [CerradosListComponent],
  imports: [CommonModule, IonicModule, CerradosListRoutingModule],
  exports: [CerradosListComponent],
})
export class CerradosListModule {}
