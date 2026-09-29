import { Component } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { PendientesProvider } from '../../../../providers/pendientes/pendientes';
import { ComunService } from '../../../../providers/comun/comun';
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
  guardando: boolean = false;
  saveSubscription: Subscription | null = null;
  queryParamsSubscripcion: Subscription | null = null;

  constructor(
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private _pendientes: PendientesProvider,
    private _login: ComunService,
    private toastCtrl: ToastController,
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
      // Evita toques repetidos mientras se guarda.
      if (this.guardando) {
        return;
      }
      this.guardando = true;

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

      this._login.ejecutarConCarga({
        mensaje: 'Guardando receptor…',
        crearPeticion: () => this._pendientes.actualizarCliente(personal),
        onSuccess: async (data: any) => {
          this.guardando = false;
          if (data?.current !== true) {
            const toast = await this.toastCtrl.create({
              message: 'No se pudo guardar el receptor. Intenta de nuevo.',
              duration: 3500,
              color: 'danger',
              position: 'bottom',
            });
            await toast.present();
            return;
          }
          this.navCtrl.pop();
        },
        onError: () => {
          this.guardando = false;
        },
      });
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
