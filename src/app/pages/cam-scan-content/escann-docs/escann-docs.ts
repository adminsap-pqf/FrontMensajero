import { Component, ViewChild } from '@angular/core';
import { ComunService } from '../../../../providers/comun/comun';
import { PendientesProvider } from '../../../../providers/pendientes/pendientes';
import { NavController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'escann-docs',
  templateUrl: 'escann-docs.html',
  styleUrls: ['escann-docs.scss'],
})
export class EscannDocsPage {
  @ViewChild('Html2Pdf') Html2Pdf: any;
  Documentos: any[] = [];
  Img64: string = '';
  conforme = true;
  doc: any;
  entregaRevision = false;
  facturaORemision: boolean = false;
  img: any;
  index: number = 0;
  nombreArchivo: string = '';
  openbottom = false;
  pendiente: any;
  pendientesSubscription: Subscription | null = null;
  recibeEyR: boolean = false;
  ruta: any[] = ['', ''];
  titulo: string = '';
  totalFotos: number = 0;
  usuario = this._login.getUsuario();

  constructor(
    private _login: ComunService,
    private _pendientes: PendientesProvider,
    private navCtrl: NavController,
    private route: ActivatedRoute,
  ) {
    this.pendientesSubscription = this.route.queryParams.subscribe((params) => {
      this.doc = JSON.parse(params['documentos']);
      this.pendiente = JSON.parse(params['pendiente']);
      this.nombreArchivo = 'ARCHIVO-' + this.pendiente;
      this.index = JSON.parse(params['i']);
      this.recibeEyR = JSON.parse(params['recibeEyR']);
      this.facturaORemision = JSON.parse(params['facturaORemision']);
      this.Documentos.push(this.doc);
      this.totalFotos = this.Documentos.length;
    });
  }

  ionViewWillEnter() {}

  async openCamera() {
    try {
      const image = await Camera.getPhoto({
        quality: 50,
        resultType: CameraResultType.DataUrl, // Base64
        source: CameraSource.Camera,
      });

      this.Img64 = image.dataUrl!;
      const obj = {
        ruta: this.Img64,
        idimg: 'img' + this.Documentos.length,
        iddiv: 'div' + this.Documentos.length,
      };
      this.Documentos.push(obj);
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
    this.Documentos.splice(i, 1);
    this.totalFotos = this.Documentos.length;
  }

  // Generar PDF
  pdf() {
    const loading = document.createElement('ion-loading');
    loading.message = 'Generando PDF...';
    loading.spinner = 'circles';
    loading.duration = 4000;

    document.body.appendChild(loading);
    loading.present();

    this.esconder();
    this.open();
  }

  open() {
    const content = this.Documentos.map((data) => data.ruta);
    const imagenes = content.map((ruta) => ruta.split(',')[1]);
    this.pendientesSubscription = this._pendientes
      .guardaDocumentacionFotos(
        imagenes,
        [this.pendiente],
        `${this.usuario.idEmpleado}/${this.pendiente}`,
      )
      .subscribe({
        next: (data) => {
          console.log('Subida exitosa:', data);
          this.navCtrl.pop(); // Regresa a la página anterior
        },
        error: (error) => {
          console.error('Error al subir imágenes:', error);
        },
      });
  }

  esconder() {
    this.openbottom = false;
  }

  mostrar() {
    this.openbottom = true;
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
  }
}
