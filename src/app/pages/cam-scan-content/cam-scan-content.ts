import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { ComunService } from '../../../providers/comun/comun';
import { PendientesProvider } from '../../../providers/pendientes/pendientes';
import {
  EstadoEvidencia,
  EvidenciasService,
} from '../../../providers/evidencias/evidencias';
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
  ruta: any[] = ['', ''];
  codigoValido: any[] = [];
  estadoEvidencia: (EstadoEvidencia | null)[] = [];
  private resumenSubscription: Subscription | null = null;
  entregaRevision: any[] = [];
  realizados: any[] = [];
  noRealizados: any[] = [];
  finalizando: boolean = false;

  constructor(
    private _login: ComunService,
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private _pendientes: PendientesProvider,
    private _evidencias: EvidenciasService,
  ) {
    this.route.queryParams.subscribe((params: any) => {
      this.listo = params?.listo || false;
      this.realizados = params?.realizados || [];
      this.noRealizados = params?.noRealizados || [];
      this.entregaRevision = params?.entregaRevision || [];
    });
  }

  ionViewWillEnter(): void {
    // Al regresar de escann-docs: la fila se marca como completada SOLO si la
    // subida de evidencia terminó con confirmación del servidor. Si falló o el
    // usuario regresó sin subir, la cámara sigue disponible para reintentar.
    const idx = this._login.evidenciaSubidaIndex;
    if (idx !== null && idx !== undefined) {
      this.codigoValido[idx] = true;
      this._login.evidenciaSubidaIndex = null;
    }

    this.resumenSubscription?.unsubscribe();
    this.resumenSubscription = this._evidencias.resumen$.subscribe(() =>
      this.sincronizarConCola(),
    );
  }

  ionViewWillLeave(): void {
    this.resumenSubscription?.unsubscribe();
    this.resumenSubscription = null;
  }

  private sincronizarConCola(): void {
    const porFolio = this._evidencias.ultimoPorFolio();
    const vigencia = Date.now() - 12 * 60 * 60 * 1000;
    this.realizados.forEach((item: any, i: number) => {
      const candidato = porFolio[item.folioEvento];
      const trabajo =
        candidato &&
        (candidato.estado !== 'COMPLETADO' || candidato.creado > vigencia)
          ? candidato
          : null;
      this.estadoEvidencia[i] = trabajo ? trabajo.estado : null;
      if (trabajo) {
        this.codigoValido[i] = true;
      }
    });
  }

  textoEstado(estado: EstadoEvidencia | null): string {
    switch (estado) {
      case 'PENDIENTE':
      case 'SUBIENDO':
        return 'Enviando…';
      case 'ENVIADO':
        return 'Procesando…';
      case 'COMPLETADO':
        return 'Enviada';
      case 'ERROR':
        return 'Error · tocar para reintentar';
      default:
        return '';
    }
  }

  tocarFila(index: number, item: any): void {
    if (this.estadoEvidencia[index] === 'ERROR') {
      this._evidencias.reintentarErrores();
      return;
    }
    if (!this.codigoValido[index]) {
      this.openCamera(index, item.folioEvento);
    }
  }

  esconder(): void {
    this.openbottom = false;
  }

  async openCamera(index: number, pendiente: any): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: 45,
        width: 1280,
        height: 1600,
        correctOrientation: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      const foto = await this._evidencias.guardarFoto(image);

      // Navegar a la página de EscannDocs. La fila ya NO se marca aquí: se
      // marca en ionViewWillEnter cuando la subida se confirma (antes se
      // marcaba al tomar la foto, aunque la subida fallara, y la cámara
      // desaparecía sin haber evidencia real).
      this.navCtrl.navigateForward(['tabs/en-cierre/escann-docs'], {
        queryParams: {
          foto: JSON.stringify(foto),
          pendiente: JSON.stringify(pendiente),
          evento: this.realizados[0]?.evento,
          i: index,
          recibeEyR: this.realizados[0]?.aceptaEyR,
          facturaORemision: this.realizados[0]?.facturaORemision,
        },
      });
    } catch (error) {
      console.error('Error al abrir la cámara:', error);
    }
  }

  finalizado(): void {
    let finalizar: boolean = true;

    if (this.codigoValido.length > 0) {
      for (let item of this.codigoValido) {
        if (!item) {
          finalizar = false;
        }
      }
    } else {
      finalizar = false;
    }

    if (!finalizar) {
      console.log('No se puede finalizar. Algunos códigos no son válidos.');
      return;
    }

    // Evita toques repetidos mientras la operación está en curso.
    if (this.finalizando) {
      return;
    }
    this.finalizando = true;

    console.log(this.realizados);

    // El mapeo de entregaRevision/extra depende del índice y se hace UNA sola
    // vez aquí. Los reintentos usan enviarCierre() para no volver a mapear sobre
    // una lista ya recortada (los índices se desalinearían).
    if (this.realizados[0].aceptaEyR) {
      for (let i = 0; i < this.realizados.length; i++) {
        this.realizados[i].entregaRevision = this.entregaRevision[i];
        this.realizados[i].extra = null;
      }
    } else {
      for (let i = 0; i < this.realizados.length; i++) {
        this.realizados[i].extra = null;
      }
    }

    this.enviarCierre();
  }

  /**
   * Envía la lista actual de realizados al back. Se reutiliza en los reintentos:
   * si hubo cierre parcial, `this.realizados` ya quedó recortada solo a los
   * folios que faltan, así que un reintento manda únicamente esos.
   */
  private enviarCierre(): void {
    this.finalizando = true;
    // Opción C: se envían los folios en tandas pequeñas secuenciales, con un
    // overlay bloqueante que muestra el avance para que el usuario no vuelva a
    // picar. Cada tanda usa el cierre por-folio idempotente de Fase 1.
    this._login
      .ejecutarPorTandas({
        items: this.realizados,
        folioDe: (item: any) => item.folioEvento,
        enviarTanda: (tanda: any[]) =>
          this._pendientes.cerrarRuta(
            tanda,
            this.usuario['idEmpleado'],
            this.usuario['usuario'],
          ),
        tamanoTanda: 1,
        // Folios pesados (muchas piezas Estandares → cientos de inserts + PDF +
        // correo) pueden tardar >30s; sin este margen el front los marcaría como
        // fallidos aunque el back sí los cerró, y un reintento duplicaría inserts.
        segundosTimeoutTanda: 200,
        mensaje: 'Cerrando pendientes…',
      })
      .then((resumen) => {
        this.finalizando = false;

        // Todo cerró.
        if (resumen.foliosFallidos.length === 0) {
          this.avanzarTrasCierre();
          return;
        }

        // Cierre parcial: dejamos SOLO los folios que faltan y reintentamos esos.
        // Los ya cerrados no se reenvían (y por idempotencia tampoco se duplican).
        const fallidos = new Set(resumen.foliosFallidos);
        this.realizados = this.realizados.filter((p) =>
          fallidos.has(p.folioEvento),
        );
        this._login.mostrarCierreParcial(
          resumen.cerrados,
          resumen.total,
          () => this.enviarCierre(),
          () => this.avanzarTrasCierre(),
        );
      })
      .catch(() => {
        // Se queda en la pantalla con la evidencia para reintentar.
        this.finalizando = false;
      });
  }

  /** Navega según queden o no pendientes 'No realizados' por justificar. */
  private avanzarTrasCierre(): void {
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
  }

}
