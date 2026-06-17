import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnCierreRoutingModule } from './en-cierre-routing.module';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { EnCierreComponent } from './en-cierre.component';

@NgModule({
  declarations: [EnCierreComponent],
  imports: [IonicModule, RouterLink, CommonModule, EnCierreRoutingModule],
  exports: [EnCierreComponent],
})
export class EnCierreModule {}
