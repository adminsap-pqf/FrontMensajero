import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-en-cierre-detalle',
  templateUrl: './en-cierre-detalle.html',
  styleUrls: ['./en-cierre-detalle.scss'],
})
export class EnCierreDetallePage {
  categorias: any[] = [];
  pakinglist: any[] = [];
  pakinglist2: any[] = [];
  pendientes: any[] = [];
  pendientes2: any[] = [];
  totalPendientes: number = 0;
  totalFolio: any[] = [];
  lista: boolean = true;
  checks: boolean = false;
  _pkList: any[] = [];
  posi: number = 0;
  imagenValido: any[] = [];
  codigoValido: any = {};
  codigoValido2: any[] = [];
  arrayAux: any = [];
  pendientesAgrupados: any[] = [];
  nombreCliente: string = '';
  items: any[] = [];
  totalEventos: number = 0;
  numeroValidador: any;
  data: any[] = [];
  queryParamsSubscription: Subscription | null = null;

  constructor(
    private navCtrl: NavController,
    private route: ActivatedRoute,
  ) {
  }

  ionViewWillEnter() {
    if (this.items.length === 0) {
      this.arrayAux = [];
      this.codigoValido = [];
      this.codigoValido2 = [];
      this.totalEventos = 0;
      this.data = [];
      this.pendientesAgrupados = [];
      // Capturar los queryParams
      this.queryParamsSubscription = this.route.queryParams.subscribe(
        (params) => {
          this.nombreCliente = params['nombre'];
          this.items = params['items'] ? JSON.parse(params['items']) : [];
          this.pendientes = params['pendientes']
            ? JSON.parse(params['pendientes'])
            : [];

          this.initData();
        },
      );
    }
  }

  initData() {
    console.log('items', this.items);
    if (this.items && this.items.length > 0) {
      for (let item of this.items) {
        let repetido: boolean = false;
        let itemPendiente = {evento: '', eventos: 0, items: []};
        if (this.pendientesAgrupados && this.pendientesAgrupados.length > 0) {
          for (let itemPA of this.pendientesAgrupados) {
            if (itemPA.evento === item.evento) {
              repetido = true;
              itemPA.eventos++;
              itemPA.items.push(item);
              if (item.evento === 'Entrega') {
                this.totalEventos += item.extra.length;
                this.codigoValido[item.evento].push(
                  new Array(item.extra.length).fill(false),
                );
                console.log('codigoValido -> ', this.codigoValido);
              } else {
                this.totalEventos++;
                this.codigoValido[item.evento].push(null);
              }
            }
          }
          if (!repetido) {
            this.addPendiente(itemPendiente, item);
          }
        } else {
          this.addPendiente(itemPendiente, item);
        }
      }
    }

    this.arrayAux = [...this.pendientesAgrupados];
    this.numeroValidador = this.arrayAux.length;
    for (let i = 0; i < this.arrayAux.length; i++) {
      this.data.push({
        title: this.arrayAux[i].evento,
        details: this.arrayAux[i].items,
        eventos: this.arrayAux[i].eventos,
        icon: 'chevron-down',
        showDetails: false,
      });
    }
  }

  private addPendiente(itemPendiente: any, item: any) {
    itemPendiente.evento = item.evento;
    itemPendiente.eventos = 1;
    itemPendiente.items.push(item);
    this.pendientesAgrupados.push(itemPendiente);
    if (item.evento === 'Entrega') {
      this.totalEventos += item.extra.length;
      this.codigoValido[item.evento] = [
        new Array(item.extra.length).fill(false),
      ];
    } else {
      this.totalEventos++;
      this.codigoValido[item.evento] = [null];
    }
  }

  go(i: number, items: any[]) {
    this.lista = false;
    this.checks = true;
    this._pkList = [];
    this.codigoValido2[0] = null;
    this.imagenValido = [];
    this.codigoValido = [];
    this.codigoValido2 = [];
    this.arrayAux = items;

    if (items[0]?.evento === 'Entrega') {
      for (let s = 0; s < this.arrayAux.length; s++) {
        this.codigoValido.push(false);
        this.codigoValido2.push(new Array(items[s].extra.length).fill(null));
      }
    } else {
      for (let s = 0; s < this.arrayAux.length; s++) {
        this.codigoValido.push(null);
      }
    }
  }

  back() {
    // DOCS: Si esta en la vista uno , regresa a la vista anterior
    if (this.lista) {
      this.navCtrl.navigateRoot(['tabs/en-cierre']);
      return;
    }
    // DOCS: Si esta en la vista dos , regresa a la vista
    this.lista = true;
    this.checks = false;
  }

  receptor() {
    let itemTrue: any[] = [];
    let itemFalse: any[] = [];

    // Acumula los folios de TODOS los eventos antes de navegar. 'Entrega' arma
    // sus extras (Packing Lists) en processEntrega; los demás eventos —Entrega
    // especial, Revisión, Cobro, Recolección— se clasifican aquí por su
    // codigoValido.
    for (let i = 0; i < this.arrayAux.length; i++) {
      if (this.arrayAux[i].evento !== 'Entrega') {
        if (this.codigoValido[i]) {
          this.arrayAux[i].realizadoTxt = 'Realizada';
          itemTrue.push({...this.arrayAux[i]});
        } else {
          this.arrayAux[i].realizadoTxt = 'No realizada';
          itemFalse.push({...this.arrayAux[i]});
        }
      } else {
        this.processEntrega(itemTrue, itemFalse, i);
      }
    }

    // Antes la navegación estaba condicionada a que hubiera un evento 'Entrega'
    // (candado hayEntrega): por eso la Entrega especial y los demás tipos no
    // avanzaban con FINALIZAR. Ahora navega según haya realizadas o no, para
    // TODOS los tipos (Entrega especial también lleva receptor + firma).
    if (itemTrue.length > 0) {
      this.navCtrl.navigateForward(['/tabs/en-cierre/realizado'], {
        queryParams: {
          realizados: JSON.stringify(itemTrue),
          noRealizados: JSON.stringify(itemFalse),
        },
      });
    } else {
      this.navCtrl.navigateForward(['tabs/en-cierre/no-realizado'], {
        queryParams: {
          noRealizados: JSON.stringify(itemFalse),
          isRealizados: false,
        },
      });
    }
  }

  private processEntrega(
    itemTrue: Array<any>,
    itemFalse: Array<any>,
    i: number,
  ) {
    for (let x = 0; x < this.arrayAux[i].extra.length; x++) {
      if (this.codigoValido2[i][x] != null) {
        if (this.codigoValido2[i][x]) {
          itemTrue.push(this.arrayAux[i].extra[x]);
        } else {
          itemFalse.push(this.arrayAux[i].extra[x]);
        }
      }
    }
  }

  realizar(i: number, i2?: number) {
    if (i2 != undefined) {
      this.codigoValido2[i][i2] = true;
    } else {
      this.codigoValido[i] = true;
    }
  }

  noRealizar(i: number, i2?: number) {
    if (i2 != undefined) {
      this.codigoValido2[i][i2] = false;
    } else {
      this.codigoValido[i] = false;
    }
  }

  click(i: number, i2?: number) {
    if (this.arrayAux[0]?.evento === 'Entrega') {
      if (i2 == undefined) {
        this.codigoValido[i] = !this.codigoValido[i];
        for (let x = 0; x < this.codigoValido2[i].length; x++) {
          this.codigoValido2[i][x] = this.codigoValido[i];
        }
      } else {
        this.codigoValido2[i][i2] = !this.codigoValido2[i][i2];
      }
    } else {
      this.codigoValido[i] = !this.codigoValido[i];
    }
  }
  ionViewWillLeave() {
    this.queryParamsSubscription?.unsubscribe();
  }
}
