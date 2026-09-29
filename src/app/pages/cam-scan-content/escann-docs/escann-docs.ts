import { Component } from '@angular/core';
import { ComunService } from '../../../../providers/comun/comun';
import {
  EvidenciasService,
  FotoLocal,
} from '../../../../providers/evidencias/evidencias';
import { NavController, ToastController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'escann-docs',
  templateUrl: 'escann-docs.html',
  styleUrls: ['escann-docs.scss'],
})
export class EscannDocsPage {
  Documentos: FotoLocal[] = [];
  conforme = true;
  entregaRevision = false;
  facturaORemision: boolean = false;
  index: number = 0;
  pendiente: any;
  pendientesSubscription: Subscription | null = null;
  recibeEyR: boolean = false;
  totalFotos: number = 0;
  guardando: boolean = false;
  private encolada = false;
  usuario = this._login.getUsuario();

  constructor(
    private _login: ComunService,
    private _evidencias: EvidenciasService,
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
  ) {
    this.pendientesSubscription = this.route.queryParams.subscribe((params) => {
      this.pendiente = JSON.parse(params['pendiente']);
      this.index = JSON.parse(params['i']);
      this.recibeEyR = JSON.parse(params['recibeEyR'] ?? 'false');
      this.facturaORemision = JSON.parse(params['facturaORemision'] ?? 'false');
      this.Documentos = [JSON.parse(params['foto'])];
      this.totalFotos = this.Documentos.length;
    });
  }

  async openCamera() {
    try {
      const image = await Camera.getPhoto({
        quality: 45,
        width: 1280,
        height: 1600,
        correctOrientation: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });
      this.Documentos.push(await this._evidencias.guardarFoto(image));
      this.totalFotos = this.Documentos.length;
    } catch (err) {
      console.error('Error en la cámara:', err);
      this.showCameraError();
    }
  }

  showCameraError() {
    alert(
      'No se puede abrir la cámara. Asegúrate de estar en un dispositivo móvil.',
    );
  }

  // Eliminar una foto
  borrar(i: number) {
    const [foto] = this.Documentos.splice(i, 1);
    this._evidencias.descartarFotos([foto]);
    this.totalFotos = this.Documentos.length;
  }

  // Subir evidencia con UN solo botón. El indicador de carga dura lo que dure
  // la subida real y el botón se bloquea para evitar toques dobles.
  async guardarEvidencia() {
    if (this.guardando || this.Documentos.length === 0) {
      return;
    }
    this.guardando = true;
    try {
      await this._evidencias.encolar({
        folioEvento: this.pendiente,
        valor: `${this.usuario.idEmpleado}/${this.pendiente}`,
        fotos: this.Documentos,
      });
      this.encolada = true;
      this._login.evidenciaSubidaIndex = this.index;

      //TIEMPO DE CARGA
        // Avisa a cam-scan-content que ESTE folio ya tiene evidencia subida,
        // para que marque la fila solo con la confirmación del servidor.
        // Se mantiene en la pantalla para reintentar sin perder las fotos.
      const toast = await this.toastCtrl.create({
        message: 'Evidencia guardada. Se enviará en segundo plano.',
        duration: 2500,
        color: 'success',
        position: 'bottom',
      });
      await toast.present();
      this.navCtrl.pop();
    } catch (e) {
      console.error('No se pudo guardar la evidencia', e);
      this.guardando = false;
      const toast = await this.toastCtrl.create({
        message:
          'No se pudo guardar la evidencia en el teléfono. Revisa el espacio disponible e intenta de nuevo.',
        duration: 4000,
        color: 'danger',
        position: 'bottom',
      });
      await toast.present();
    }
  }

  selectEntrega() {
    this.conforme = true;
    this.entregaRevision = false;
  }

  selectERevision() {
    this.conforme = false;
    this.entregaRevision = true;
  }

  ionViewWillLeave() {
    this.pendientesSubscription?.unsubscribe();
    if (!this.encolada) {
      this._evidencias.descartarFotos(this.Documentos);
    }
  }
}
