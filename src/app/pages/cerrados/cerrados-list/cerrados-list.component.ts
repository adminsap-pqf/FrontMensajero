import { Component } from '@angular/core';
import { PendientesProvider } from '../../../../providers/pendientes/pendientes';
import { ComunService } from '../../../../providers/comun/comun';
import { Subscription } from 'rxjs';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'page-cerrados',
  templateUrl: './cerrados-list.component.html',
  styleUrls: ['./cerrados-list.component.scss'],
})
export class CerradosListComponent {
  usuario = this._login.getUsuario();

  data: any[] = [];
  selectData: number = 0;

  categorias: any[] = [];

  pakinglists: any[] = [];
  pakinglist2: any[] = [];
  pendientes1: any[] = [];
  pendientes2: any[] = [];

  cerrados: any[] = [];
  cerradosAgrupados: any[] = [];
  arrayAux: any = [];

  totalPendientes: number = 0;
  _nombre: string = '';
  showUno: boolean = false;
  obtenerPendientesCerradosSubscription: Subscription | null = null;

  constructor(
    public _pendientes: PendientesProvider,
    private _login: ComunService,
    // private _router: Router,
    private navCtrl: NavController,
  ) {
  }

  ionViewWillEnter() {
    console.log('entró');
    let us = this.usuario['usuario'];
    this.arrayAux = [];
    this.obtenerPendientesCerradosSubscription = this._pendientes
      .obtenerPendientesCerrados(us)
      .subscribe({
        next: (data) => {
          console.log('ya recibió los datos', data);
          data.current.forEach((element: any) => {
            this.cerrados.push(element);
          });
          if (this.cerrados != undefined && this.cerrados.length > 0) {
            for (let item of this.cerrados) {
              let repetido: Boolean = false;
              let itemPEndiente = {
                empresa: '',
                eventos: 0,
                inaplasables: 0,
                urgentes: 0,
                normales: 0,
                ruta: '',
                items: [],
                coordenada: [],
              };
              if (
                this.cerradosAgrupados != undefined &&
                this.cerradosAgrupados.length > 0
              ) {
                for (let itemPA of this.cerradosAgrupados) {
                  if (itemPA.empresa == item.empresa) {
                    repetido = true;

                    if (item.evento == 'Entrega') {
                      let itemRepetido: boolean = false;
                      for (let itemItem of itemPA.items) {
                        if (itemItem.folioEvento == item.folioEvento) {
                          itemRepetido = true;
                          itemItem.folioProducto += ',' + item.folioProducto;
                        }
                      }
                      if (!itemRepetido) {
                        itemPA.eventos++;
                        itemPA.inaplasables =
                          item.prioridad == 'Inaplazable'
                            ? itemPA.inaplasables + 1
                            : itemPA.inaplasables;
                        itemPA.urgentes =
                          item.prioridad == 'Urgente'
                            ? itemPA.urgentes + 1
                            : itemPA.urgentes;
                        itemPA.normales =
                          item.prioridad == 'Normal'
                            ? itemPA.normales + 1
                            : itemPA.normales;
                        itemPEndiente.coordenada = [
                          // @ts-ignore
                          {lat: item.latitud, lng: item.longitud},
                        ];
                        itemPA.items.push(item);
                      }
                    } else {
                      itemPA.eventos++;
                      itemPA.inaplasables =
                        item.prioridad == 'Inaplazable'
                          ? itemPA.inaplasables + 1
                          : itemPA.inaplasables;
                      itemPA.urgentes =
                        item.prioridad == 'Urgente'
                          ? itemPA.urgentes + 1
                          : itemPA.urgentes;
                      itemPA.normales =
                        item.prioridad == 'Normal'
                          ? itemPA.normales + 1
                          : itemPA.normales;
                      itemPEndiente.coordenada = [
                        // @ts-ignore
                        {lat: item.latitud, lng: item.longitud},
                      ];
                      itemPA.items.push(item);
                    }
                  }
                }
                if (!repetido) {
                  itemPEndiente.empresa = item.empresa;
                  itemPEndiente.eventos = 1;
                  itemPEndiente.inaplasables =
                    item.prioridad == 'Inaplazable' ? 1 : 0;
                  itemPEndiente.urgentes = item.prioridad == 'Urgente' ? 1 : 0;
                  itemPEndiente.normales = item.prioridad == 'Normal' ? 1 : 0;
                  itemPEndiente.ruta = item.direccion;
                  itemPEndiente.coordenada = [
                    // @ts-ignore
                    {lat: item.latitud, lng: item.longitud},
                  ];
                  this.cerradosAgrupados.push(itemPEndiente);
                  // @ts-ignore
                  itemPEndiente.items.push(item);
                }
              } else {
                itemPEndiente.empresa = item.empresa;
                itemPEndiente.eventos = 1;
                itemPEndiente.inaplasables =
                  item.prioridad == 'Inaplazable' ? 1 : 0;
                itemPEndiente.urgentes = item.prioridad == 'Urgente' ? 1 : 0;
                itemPEndiente.normales = item.prioridad == 'Normal' ? 1 : 0;
                itemPEndiente.ruta = item.direccion;
                // @ts-ignore
                itemPEndiente.items.push(item);
                itemPEndiente.coordenada = [
                  // @ts-ignore
                  {lat: item.latitud, lng: item.longitud},
                ];
                this.cerradosAgrupados.push(itemPEndiente);
              }
            }
          }

          this.arrayAux = this.arrayAux.concat(this.cerradosAgrupados);
          console.log(this.arrayAux);
          this.totalPendientes = this.arrayAux.length;
        },
        error: (error) => {
          console.log(error);
        },
      });

    this.pakinglists = [
      {clave: 'PL-000001-00000', pendientes: this.pendientes1},
      {clave: 'PL-000002-00000', pendientes: this.pendientes2},
    ];

    this.pakinglist2 = [
      {clave: 'PL-000003-00000', pendientes: []},
      {clave: 'PL-000004-00000', pendientes: []},
    ];

    this.categorias = [
      {
        category: 'Entrega',
        pakinglist: this.pakinglists,
      },
      {
        category: 'Revisión',
        pakinglist: this.pakinglist2,
      },
      {
        category: 'Entrega Especial',
        pakinglist: this.pakinglist2,
      },
      {
        category: 'Cobro',
        pakinglist: this.pakinglist2,
      },
      {
        category: ' Recolección de material',
        pakinglist: this.pakinglist2,
      },
    ];

    this.totalPendientes = this.cerrados.length;

    for (let i = 0; i < this.categorias.length; i++) {
      this.data.push({
        title: this.categorias[i].category,
        details: this.categorias[i].pakinglist,
        icon: 'ios-arrow-down',
        showDetails: false,
      });
    }
  }

  ionViewWillLeave() {
    console.log('salió');
    this.obtenerPendientesCerradosSubscription?.unsubscribe();
  }

  go(i: number) {
    const params = {
      items: JSON.stringify(this.arrayAux[i].items)
    }
    console.log('enviando->', this.arrayAux[i].items)
    this.navCtrl.navigateForward(['/tabs/cerrados/cerrados-detalle'], {
      queryParams: params,
    });
  }
}
