import { Component } from '@angular/core';
import { ComunService } from '../../../providers/comun/comun';
import { PendientesProvider } from '../../../providers/pendientes/pendientes';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'cam-scan-content',
  templateUrl: 'cam-scan-content.html',
  styleUrls: ['cam-scan-content.scss'],
})
export class CamScanContentPage {
  usuario = this._login.getUsuario();
  listo: boolean = false;
  categorias: any[] = [];
  pakinglist: any[] = [];
  pakinglist2: any[] = [];
  pendientes: any[] = [];
  pendientes2: any[] = [];
  openbottom: boolean = false;
  Documentos: any[] = [];
  ruta: any[] = ['', ''];
  Img64: string = '';
  codigoValido: any[] = [];
  entregaRevision: any[] = [];
  realizados: any[] = [];
  noRealizados: any[] = [];

  constructor(
    private _login: ComunService,
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private _pendientes: PendientesProvider,
  ) {
    this.route.queryParams.subscribe((params: any) => {
      this.listo = params?.listo || false;
      this.realizados = params?.realizados || [];
      this.noRealizados = params?.noRealizados || [];
      this.entregaRevision = params?.entregaRevision || [];
    });
  }

  selectReceptor2(index: number): void {
    this.codigoValido[index] = true;
  }

  esconder(): void {
    this.openbottom = false;
  }

  async openCamera(index: number, pendiente: any): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: 50,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      this.Img64 = `data:image/jpeg;base64,${image.base64String}`;
      const obj = {
        ruta: this.Img64,
        idimg: `img${this.Documentos.length}`,
        iddiv: `div${this.Documentos.length}`,
      };

      console.log('Foto -> ', obj);
      console.log(this.realizados[0]?.acturaORemision);
      // Navegar a la página de EscannDocs
      this.navCtrl.navigateForward(['tabs/en-cierre/escann-docs'], {
        queryParams: {
          documentos: JSON.stringify(obj),
          pendiente: JSON.stringify(pendiente),
          evento: this.realizados[0]?.evento,
          i: index,
          recibeEyR: this.realizados[0]?.aceptaEyR,
          facturaORemision: this.realizados[0]?.facturaORemision,
        },
      });

      this.selectReceptor2(index);
    } catch (error) {
      console.error('Error al abrir la cámara:', error);
    }
  }

  finalizado(): void {
    let finalizar:boolean = true;

    if(this.codigoValido.length > 0){
      for(let item of this.codigoValido){
        if(!item){
          finalizar = false;
        }
      }
    }else{
      finalizar = false;
    }

    if(finalizar){
      console.log(this.realizados);

      if(this.realizados[0].aceptaEyR){
        for(let i = 0; i < this.realizados.length; i++){
          this.realizados[i].entregaRevision = this.entregaRevision[i];
          this.realizados[i].extra = null;
        }
      }else{
        for(let i = 0; i < this.realizados.length; i++){
          this.realizados[i].extra = null;
        }
      }

      this._pendientes
        .cerrarRuta(
          this.realizados,
          this.usuario['idEmpleado'],
          this.usuario['usuario'],
        )
        .subscribe(
          (data) => {
            console.log(data);
          },
          (error) => {
            console.error(error);
          },
        );

      if (this.noRealizados.length > 0) {
        this.navCtrl.navigateBack(['/tabs/en-cierre/no-realizado'], {
          queryParams: {
            noRealizados: JSON.stringify(this.noRealizados),
            isRealizados: true,
          },
        });
      } else {
        this.navCtrl.navigateRoot(['/tabs/en-cierre']);
      }
    } else {
      console.log('No se puede finalizar. Algunos códigos no son válidos.');
    }
  }
}
