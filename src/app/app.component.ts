import { Component } from '@angular/core';
import { StorageProvider } from '../providers/storage/storage';
import { EvidenciasService } from '../providers/evidencias/evidencias';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private storageService: StorageProvider,
    private evidencias: EvidenciasService,
  ) {
    this.evidencias.iniciar();
  }

  ionViewWillEnter() {
    this.storageService.init(); // Inicializa el almacenamiento
  }
}
