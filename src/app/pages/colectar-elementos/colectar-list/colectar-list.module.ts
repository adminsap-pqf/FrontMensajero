import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColectarListComponent } from './colectar-list.component';
import { ColectarListRoutingModule } from './colectar-list-routing.module';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [ColectarListComponent],
  imports: [CommonModule, ColectarListRoutingModule, IonicModule],
  exports: [ColectarListComponent],
})
export class ColectarListModule {}
