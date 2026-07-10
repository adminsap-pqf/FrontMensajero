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
  pendiente: any;
  pendientesSubscription: Subscription | null = null;
  recibeEyR: boolean = false;
  ruta: any[] = ['', ''];
  titulo: string = '';
  totalFotos: number = 0;
  subiendo: boolean = false;
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

  // Subir evidencia con UN solo botón. El indicador de carga dura lo que dure
  // la subida real y el botón se bloquea para evitar toques dobles.
  pdf() {
    if (this.subiendo || this.Documentos.length === 0) {
      return;
    }
    this.subiendo = true;
    this.open();
  }

  open() {
    const content = this.Documentos.map((data) => data.ruta);
    const imagenes = content.map((ruta) => ruta.split(',')[1]);

    this._login.ejecutarConCarga({
      mensaje: 'Subiendo evidencia…',
      //TIEMPO DE CARGA
      segundosTimeout: 120,
      crearPeticion: () =>
        this._pendientes.guardaDocumentacionFotos(
          imagenes,
          [this.pendiente],
          `${this.usuario.idEmpleado}/${this.pendiente}`,
        ),
      onSuccess: () => {
        this.subiendo = false;
        // Avisa a cam-scan-content que ESTE folio ya tiene evidencia subida,
        // para que marque la fila solo con la confirmación del servidor.
        this._login.evidenciaSubidaIndex = this.index;
        this.navCtrl.pop(); // Regresa a la página anterior
      },
      onError: () => {
        // Se mantiene en la pantalla para reintentar sin perder las fotos.
        this.subiendo = false;
      },
    });
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
