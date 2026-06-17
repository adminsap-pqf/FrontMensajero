import { Component } from '@angular/core';
import { StorageProvider } from '../providers/storage/storage';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(private storageService: StorageProvider) {}

  ionViewWillEnter() {
    this.storageService.init(); // Inicializa el almacenamiento
  }
}
