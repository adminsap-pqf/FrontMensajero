import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsComponent } from './tabs.component';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { TabsRoutingModule } from './tabs-routing.module';
import { CerradosModule } from '../../pages/cerrados/cerrados.module';

@NgModule({
  declarations: [TabsComponent],
  imports: [
    CommonModule,
    IonicModule,
    RouterLink,
    TabsRoutingModule,
    CerradosModule,
  ],
  exports: [TabsComponent],
})
export class TabsModule {}
