import { Component } from '@angular/core';
import { PendientesProvider } from '../../../../providers/pendientes/pendientes';
import { ComunService } from '../../../../providers/comun/comun';
import { NavController } from '@ionic/angular';
import { BarcodeScanner, ScanResult } from 'capacitor-barcode-scanner';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pendientes-detalle',
  templateUrl: './pendientes-detalle.component.html',
  styleUrls: ['./pendientes-detalle.component.scss'],
})
export class PendientesDetalleComponent {
  data: any[] = [];

  categorias: any[] = [];

  pakinglist: any[] = [];
  pakinglist2: any[] = [];

  pendientes: any[] = [];
  pendientes2: any[] = [];

  totalPendientes: number = 0;
  pendienteT: any[] = [];
  selectData: number = 0;
  escaneado: boolean = false;
  codigoValido: any = {};
  nombreCliente: string = '';

  arrayAux: any = [];

  pendientesAgrupados: any[] = [];

  numeroValidador: any;
  numeroAyuda: number = 0;
  totalEventos: number = 0;

  constructor(
    public navCtrl: NavController,
    public _pendientes: PendientesProvider,
    private _login: ComunService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.activatedRoute.queryParams.subscribe((params: any) => {
      this.pendienteT = JSON.parse(params.pendiente);
      this.nombreCliente = params.nombreCliente;
      console.log('Pendiente', this.pendienteT);
      console.log('Nombre Cliente', this.nombreCliente);
    });

  }

  toggleDetails(data: any, i: number) {
    this.selectData = i;
    if (data.showDetails) {
      data.showDetails = false;
      data.icon = 'chevron-down';
    } else {
      data.showDetails = true;
      data.icon = 'chevron-up';
    }
  }

  ionViewWillEnter() {
    console.log('Mensaje en consola entró a ionViewDidLoad');
    if (this.pendienteT != undefined && this.pendienteT.length > 0) {
      for (let item of this.pendienteT) {
        let repetido: Boolean = false;
        let itemPEndiente = {evento: '', eventos: 0, items: []};
        if (
          this.pendientesAgrupados != undefined &&
          this.pendientesAgrupados.length > 0
        ) {
          for (let itemPA of this.pendientesAgrupados) {
            console.log(itemPA);
            if (
              itemPA.evento.replace(' ', '_') == item.evento.replace(' ', '_')
            ) {
              repetido = true;
              itemPA.eventos++;
              itemPA.items.push(item);
              if (item.evento.replace(' ', '_') == 'Entrega') {
                this.totalEventos += item.folioProducto.split(',').length;
                if (this._login.Usuario.idFuncion != 2) {
                  this.codigoValido[item.evento].push(
                    new Array(item.folioProducto.split(','), length).fill(
                      false,
                    ),
                  );
                } else {
                  this.codigoValido[item.evento].push(
                    new Array(item.folioProducto.split(','), length).fill(true),
                  );
                }
              } else {
                this.totalEventos++;
                if (this._login.Usuario.idFuncion != 2) {
                  this.codigoValido[item.evento.replace(' ', '_')].push(false);
                } else {
                  this.codigoValido[item.evento.replace(' ', '_')].push(true);
                }
              }
            }
          }
          if (!repetido) {
            console.log(item);
            itemPEndiente.evento = item.evento.replace(' ', '_');
            itemPEndiente.eventos = 1;
            this.pendientesAgrupados.push(itemPEndiente);
            // @ts-ignore
            itemPEndiente.items.push(item);
            if (item.evento.replace(' ', '_') == 'Entrega') {
              if ((this.codigoValido[item.evento]?.length || 0) === 0) {
                this.totalEventos += item.folioProducto.split(',').length;
                if (this._login.Usuario.idFuncion != 2) {
                  this.codigoValido[item.evento] = [
                    new Array(item.folioProducto.split(','), length).fill(
                      false,
                    ),
                  ];
                } else {
                  this.codigoValido[item.evento] = [
                    new Array(item.folioProducto.split(','), length).fill(true),
                  ];
                }
              } else {
                this.totalEventos += item.folioProducto.split(',').length;
                if (this._login.Usuario.idFuncion != 2) {
                  this.codigoValido[item.evento].push(
                    new Array(item.folioProducto.split(','), length).fill(
                      false,
                    ),
                  );
                } else {
                  this.codigoValido[item.evento].push(
                    new Array(item.folioProducto.split(','), length).fill(true),
                  );
                }
              }
            } else {
              console.log(this.codigoValido);
              console.log(item.evento.replace(' ', '_'));
              console.log(this.codigoValido[item.evento.replace(' ', '_')]);
              if (
                this.codigoValido[item.evento.replace(' ', '_')] == undefined ||
                this.codigoValido[item.evento.replace(' ', '_')].length == 0
              ) {
                console.log('Entro if 1');
                this.totalEventos++;
                if (this._login.Usuario.idFuncion != 2) {
                  this.codigoValido[item.evento.replace(' ', '_')] = [false];
                } else {
                  this.codigoValido[item.evento.replace(' ', '_')] = [true];
                }
              } else {
                console.log('Entro if 2');
                this.totalEventos++;
                if (this._login.Usuario.idFuncion != 2) {
                  this.codigoValido[item.evento.replace(' ', '_')].push(false);
                } else {
                  this.codigoValido[item.evento.replace(' ', '_')].push(true);
                }
              }
              console.log(this.codigoValido);
            }
          }
        } else {
          itemPEndiente.evento = item.evento.replace(' ', '_');
          itemPEndiente.eventos = 1;
          // @ts-ignore
          itemPEndiente.items.push(item);
          this.pendientesAgrupados.push(itemPEndiente);
          if (item.evento == 'Entrega') {
            this.totalEventos += item.folioProducto.split(',').length;
            if (this._login.Usuario.idFuncion != 2) {
              this.codigoValido[item.evento] = [
                new Array(item.folioProducto.split(','), length).fill(false),
              ];
            } else {
              this.codigoValido[item.evento] = [
                new Array(item.folioProducto.split(','), length).fill(true),
              ];
            }
          } else {
            this.totalEventos++;
            if (this._login.Usuario.idFuncion != 2) {
              this.codigoValido[item.evento.replace(' ', '_')] = [false];
            } else {
              this.codigoValido[item.evento.replace(' ', '_')] = [true];
            }
          }
        }
      }
    }

    this.arrayAux = this.arrayAux.concat(this.pendientesAgrupados);
    console.log(this.arrayAux, this.codigoValido);
    this.numeroValidador = this.arrayAux.length;
    for (let i = 0; i < this.arrayAux.length; i++) {
      // aux = this.categorias[i].pakinglist;
      this.data.push({
        title: this.arrayAux[i].evento,
        details: this.arrayAux[i].items,
        eventos: this.arrayAux[i].eventos,
        icon: 'ios-arrow-down',
        showDetails: false,
      });
    }
    console.log('Mensaje en consola this.data', this.data);
  }

  async lerCodigo(i: number, x: number, i2: number | undefined): Promise<void> {
    console.log(i, x, i2);
    if (this.data[i].title == 'Entrega' && i2 === undefined) {
      return;
    }
    let codigo =
      this.data[i].title == 'Entrega'
        ? this.data[i].details[x].folioProducto.split(',')[i2!]
        : this.data[i].details[x].folioEvento; // pendiente[i]
    try {
      const barcodeData: ScanResult = await BarcodeScanner.scan();

      console.log('Mensaje en consola codigo', codigo);
      console.log('Mensaje en consola barcodeData.code', barcodeData.code);
      console.log('Mensaje en consola barcodeData.result', barcodeData.result);
      if (barcodeData.code == codigo) {
        if (this.data[i].title == 'Entrega') {
          this.codigoValido['Entrega'][x][i2!] = true;
        } else {
          this.codigoValido[this.data[i].title][x] = true;
        }
        this.numeroAyuda = this.numeroAyuda + 1;
      } else {
        console.log('No es verdadero', barcodeData.code, 0);
        console.log('No es verdadero', barcodeData.result, 0);
        if (this.data[i].title == 'Entrega') {
          this.codigoValido['Entrega'][x][i2!] = false;
        } else {
          this.codigoValido[this.data[i].title][x] = false;
        }
      }
    } catch (err) {
      console.log('Error', err);
    }
  }

  finalizar() {
    if (this._login.Usuario.idFuncion == 2) {
      this.numeroAyuda = this.totalEventos;
    }
    if (this.numeroAyuda == this.totalEventos) {
      console.log('Ya puedes pasar ');
      let lstPendientes: any[] = [];

      for (let item of this.pendienteT) {
        if (item.evento == 'Entrega') {
          for (let item2 of item.folioDocumento.split(',')) {
            let pendiente: any = {
              estadoPendiente: 'EnEjecucion',
              idCliente: item.idCliente,
              folioEvento: item2,
            };
            lstPendientes.push(pendiente);
          }
        } else {
          let pendiente: any = {
            estadoPendiente: 'EnEjecucion',
            idCliente: item.idCliente,
            folioEvento: item.folioEvento,
          };
          lstPendientes.push(pendiente);
        }
      }

      console.log(lstPendientes);
      this._pendientes.ejecutarRuta(lstPendientes).subscribe(
        (data) => {
          console.log(data);
          this.navCtrl.navigateRoot(['/tabs/pendientes/pendientes-list']);
        },
        (error) => {
          console.log(error);
        },
      );
    } else {
      console.log('aun no te terminas');
    }
  }
}
