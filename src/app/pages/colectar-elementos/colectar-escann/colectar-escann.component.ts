import { Component, OnInit } from '@angular/core';
import { ComunService } from '../../../../providers/comun/comun';
import { PendientesProvider } from '../../../../providers/pendientes/pendientes';
import { ActivatedRoute, Router } from '@angular/router';
import { BarcodeScanner, ScanResult } from 'capacitor-barcode-scanner';
import { Subscription } from 'rxjs';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-colectar-escann',
  templateUrl: './colectar-escann.component.html',
  styleUrls: ['./colectar-escann.component.scss'],
})
export class ColectarEscannComponent {
  items: any[] = [];
  nombreCliente: any;
  codigoValido: any[] = [];
  acronimo: any;
  dataSubscription: Subscription | null = null;

  constructor(
    private _pendientes: PendientesProvider,
    private comunService: ComunService,
    // DOCS: utilizar ActivatedRoute para obtener parametros de la URL con NavParams
    private activatedRoute: ActivatedRoute,
    // DOCS: utilizar NavController para apps
    private navCtrl: NavController,
  ) {
  }

  /**
   * Obtiene los parametros atravez de la ruta para llenar variables
   * **/
  //DOCS: Utilizar ionViewWillEnter en lugar de ngOnInit para apps, eso forza carcargar los datos cada vez que se entra a la vista
  ionViewWillEnter() {
    // DOCS: Asi se obtienen los parametros de la URL por medio de ActivatedRoute usando NavController
    this.activatedRoute.queryParams.subscribe((params: any) => {
      this.items = JSON.parse(params?.items);
      this.nombreCliente = this.items[0]?.empresa;
      this.codigoValido = this.initializeCodigoValido();
      this.acronimo = this.getAcronimo(this.items[0]?.evento);
    });
  }

  private initializeCodigoValido(): any[] {
    return this.items.map((item) => {
      if (item.evento === 'Entrega') {
        return this.comunService.Usuario.idFuncion !== 2
          ? new Array(item.folioProducto.split(',').length).fill(false)
          : new Array(item.folioProducto.split(',').length).fill(true);
      } else {
        return this.comunService.Usuario.idFuncion !== 2 ? false : true;
      }
    });
  }

  /**
   * @method getAcronimo
   * @param {string} evento
   * @return {string} Devuelve un acronimo
   * **/
  private getAcronimo(evento: string): string {
    switch (evento) {
      case 'Entrega':
        return 'PL';
      case 'Revision':
        return 'PR';
      case 'Entrega especial':
        return 'ES';
      case 'Cobro':
        return 'PC';
      case 'Recolección':
        return 'RM';
      default:
        return '';
    }
  }

  /**
   * @method leetCodigo
   * @param {number} i
   * @param {number} i2
   * Lee el codigo QR y determina si es un codigo valido
   * **/
  async leerCodigo(i: number, i2?: number) {
    console.log('Leyendo código:', i, i2);
    if (this.items[0]?.evento === 'Entrega' && i2 === undefined) {
      return;
    }

    const codigo =
      this.items[0]?.evento === 'Entrega'
        ? // @ts-ignore
        this.items[i].folioProducto.split(',')[i2]
        : this.items[i].folioEvento;

    console.log('Leyendo código:', codigo);

    try {
      const barcodeData: ScanResult = await BarcodeScanner.scan();
      const isCodeValid = barcodeData.code === codigo;

      if (this.items[0]?.evento === 'Entrega') {
        // @ts-ignore
        this.codigoValido[i][i2] = isCodeValid;
      } else {
        this.codigoValido[i] = isCodeValid;
      }

      console.log(
        isCodeValid ? 'Código válido' : 'Código no válido',
        barcodeData.result,
        codigo,
      );
    } catch (error) {
      console.error('Error al escanear código:', error);
    }
  }

  finalizar() {
    let finalizar: boolean = true;

    if (this.items[0].evento === 'Entrega') {
      for (let item of this.codigoValido) {
        for (let item2 of item) {
          if (!item2) {
            finalizar = false;
          }
        }
      }
    } else {
      for (let item of this.codigoValido) {
        if (!item) {
          finalizar = false;
        }
      }
    }

    if (finalizar) {
      console.log('Finalizar');
      let lstPendientes: any[] = [];

      if (this.items[0].evento === 'Entrega') {
        for (let item of this.items) {
          for (let item2 of item.folioDocumento.split(',')) {
            let pendiente: any = {
              estadoPendiente: 'Colectado',
              idCliente: item.idCliente,
              folioEvento: item2,
            };
            lstPendientes.push(pendiente);
          }
        }
      } else {
        for (let item of this.items) {
          let pendiente: any = {
            estadoPendiente: 'Colectado',
            idCliente: item.idCliente,
            folioEvento: item.folioEvento,
          };
          lstPendientes.push(pendiente);
        }
      }

      this.dataSubscription = this._pendientes
        .ejecutarRuta(lstPendientes)
        .subscribe({
          next: (data) => {
            try {
              // DOCS: Filtra los elementos que no se encuentran en la lista de pendientes
              const itemsFiltered = this.items.filter(
                (b) =>
                  !lstPendientes.some(
                    (a) => a.folioEvento === b.folioDocumento,
                  ),
              );
              // DOCS: Si aún tiene colectas regresa a la vista anterior
              if (itemsFiltered.length) {
                this.navCtrl.navigateBack(['tabs', 'colectar', 'colectar-detalle'], {
                  state: {items: JSON.stringify(itemsFiltered)},
                });
              } else {
                // DOCS: Sino redirige a la vista de colectar-list
                this.navCtrl.navigateBack(['tabs', 'colectar', 'colectar-list']);
              }
            } catch (error) {
              console.log(error);
            }
          },
        });
    }
  }

  ionViewWillLeave() {
    this.dataSubscription?.unsubscribe();
  }
}
