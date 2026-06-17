import { Component } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';

@Component({
  selector: 'page-mis-recorridos',
  templateUrl: './mis-recorridos.html',
  styleUrls: ['./mis-recorridos.scss'],
})
export class MisRecorridosPage {
  opciones: Array<any> = [];

  constructor(
    private modalCtrl: ModalController,
    public navParams: NavParams,
  ) {
    this.opciones = navParams.get('opciones');
  }

  ionViewDidLoad() {}

  // Método para cerrar el modal y devolver datos al componente padre
  cerrarModal(recorrido?: any) {
    this.modalCtrl.dismiss(
      recorrido
        ? {
            opcion: recorrido,
          }
        : null,
    );
  }
}
