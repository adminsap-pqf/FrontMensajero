import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { PendientesProvider } from '../../../../providers/pendientes/pendientes';
import { Subscription } from 'rxjs';

@Component({
  selector: 'agregar-receptor',
  templateUrl: 'agregar-receptor.html',
  styleUrls: ['agregar-receptor.scss'],
})
export class AgregarReceptorPage {
  validate: boolean = false;
  openbottom = false;
  idCliente: number = 0;
  nombre: string = '';
  apellido: string = '';
  puesto: string = '';
  saveSubscription: Subscription | null = null;
  queryParamsSubscripcion: Subscription | null = null;

  constructor(
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private _pendientes: PendientesProvider,
  ) {
    this.queryParamsSubscripcion = this.route.queryParams.subscribe({
      next: (params) => {
        this.idCliente = JSON.parse(params['idCliente']);
      },
    });
  }

  esconder() {
    this.openbottom = false;
  }

  receptor() {
    if (this.nombre !== '' && this.apellido !== '' && this.puesto !== '') {
      let personal: any = [
        {
          idPersonal: 0,
          idCliente: this.idCliente,
          nombre: this.nombre + ' ' + this.apellido,
          puesto: this.puesto,
          borrar: false,
        },
      ];
      console.log(personal);
      this.saveSubscription = this._pendientes
        .actualizarCliente(personal)
        .subscribe((data) => {
          console.log(data);
        });
      this.navCtrl.pop();
    }
  }

  cancelar() {
    this.navCtrl.back();
  }

  ionViewWillLeave() {
    this.saveSubscription?.unsubscribe();
    this.queryParamsSubscripcion?.unsubscribe();
  }
}
