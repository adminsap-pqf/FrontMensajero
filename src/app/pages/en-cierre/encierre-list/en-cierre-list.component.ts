import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ComunService } from '../../../../providers/comun/comun';
import { PendientesProvider } from '../../../../providers/pendientes/pendientes';
import { Subscription } from 'rxjs';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-en-cierre',
  templateUrl: './en-cierre-list.component.html',
  styleUrls: ['./en-cierre-list.component.scss'],
})
export class EnCierreListComponent {
  arrayAux: any = [];
  categorias: any[] = [];
  checks: boolean = this.activatedRoute.snapshot.queryParams['data'];
  codigoValido2: any[] = [];
  codigoValido: any[] = [];
  enCierre: any[] = [];
  items: any[] = [];
  lista: boolean = true;
  nombreCliente: string = '';
  pakinglist2: any[] = [];
  pakinglist: any[] = [];
  pendientes2: any[] = [];
  pendientesAgrupados: any[] = [];
  posi: number = this.activatedRoute.snapshot.queryParams['posi'];
  totalFolio: any[] = [];
  totalPendientes: number = 0;
  usuario = this._login.getUsuario();
  cargando: boolean = false;
  pendientesSubscription: Subscription | null = null;

  constructor(
    private _login: ComunService,
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private _pendientes: PendientesProvider,
  ) {
  }

  ionViewWillEnter() {
    this.initializeData();
  }

  private initializeData() {
    this.arrayAux = [];
    this.totalPendientes = 0;
    this.pendientesAgrupados = [];
    this.enCierre = [];
    // El spinner arranca desde antes del setTimeout: el usuario ve "cargando"
    // durante la espera interna + la respuesta del servidor.
    this.cargando = true;
    const us = this.usuario['usuario'];

    setTimeout(() => {
      this.pendientesSubscription = this._pendientes.enCierre(us).subscribe({
        next: (data: any) => {
          this.cargando = false;
          data.current.forEach((element: any) => {
            this.enCierre.push(element);
          });
          console.log(this.enCierre);

          if (this.enCierre && this.enCierre.length > 0) {
            for (let item of this.enCierre) {
              let repetido: boolean = false;
              let itemPendiente: any = {
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
                this.pendientesAgrupados &&
                this.pendientesAgrupados.length > 0
              ) {
                for (let itemPA of this.pendientesAgrupados) {
                  if (
                    itemPA.empresa === item.empresa &&
                    itemPA.coordenada[0]?.lat === item.latitud &&
                    itemPA.coordenada[0]?.lng === item.longitud
                  ) {
                    repetido = true;

                    if (item.evento === 'Entrega') {
                      let itemRepetido = false;
                      for (let itemItem of itemPA.items) {
                        if (itemItem.folioDocumento === item.folioDocumento) {
                          itemRepetido = true;
                          let itemAux = {...item};
                          itemAux.extra = null;
                          itemItem.extra.push(itemAux);
                        }
                      }

                      if (!itemRepetido) {
                        itemPA.eventos++;
                        itemPA.inaplasables =
                          item.prioridad === 'Inaplazable'
                            ? itemPA.inaplasables + 1
                            : itemPA.inaplasables;
                        itemPA.urgentes =
                          item.prioridad === 'Urgente'
                            ? itemPA.urgentes + 1
                            : itemPA.urgentes;
                        itemPA.normales =
                          item.prioridad === 'Normal'
                            ? itemPA.normales + 1
                            : itemPA.normales;
                        itemPendiente.coordenada = [
                          {lat: item.latitud, lng: item.longitud},
                        ];
                        if (item.evento === 'Entrega') {
                          item.extra = [{...item}];
                        }
                        itemPA.items.push(item);
                      }
                    } else {
                      itemPA.eventos++;
                      itemPA.inaplasables =
                        item.prioridad === 'Inaplazable'
                          ? itemPA.inaplasables + 1
                          : itemPA.inaplasables;
                      itemPA.urgentes =
                        item.prioridad === 'Urgente'
                          ? itemPA.urgentes + 1
                          : itemPA.urgentes;
                      itemPA.normales =
                        item.prioridad === 'Normal'
                          ? itemPA.normales + 1
                          : itemPA.normales;
                      itemPendiente.coordenada = [
                        {lat: item.latitud, lng: item.longitud},
                      ];
                      if (item.evento === 'Entrega') {
                        item.extra = [{...item}];
                      }
                      itemPA.items.push(item);
                    }
                  }
                }
                if (!repetido) {
                  itemPendiente = this.agregarPendiente(itemPendiente, item);
                }
              } else {
                itemPendiente = this.agregarPendiente(itemPendiente, item);
              }
            }
          }

          this.arrayAux = [...this.pendientesAgrupados];
          console.log(this.arrayAux);
          this.totalPendientes = this.arrayAux.length;
        },
        error: (error: any) => {
          this.cargando = false;
          console.log(error);
        },
      });
    }, 2000);
  }

  agregarPendiente(itemPendiente: any, item: any) {
    itemPendiente.empresa = item.empresa;
    itemPendiente.eventos = 1;
    itemPendiente.inaplasables = item.prioridad === 'Inaplazable' ? 1 : 0;
    itemPendiente.urgentes = item.prioridad === 'Urgente' ? 1 : 0;
    itemPendiente.normales = item.prioridad === 'Normal' ? 1 : 0;
    itemPendiente.ruta = item.direccion;
    if (item.evento === 'Entrega') {
      item.extra = [{...item}];
    }
    itemPendiente.items.push(item);
    itemPendiente.coordenada = [{lat: item.latitud, lng: item.longitud}];
    this.pendientesAgrupados.push(itemPendiente);
    return itemPendiente;
  }

  go(i: number) {
    const params = {
      nombre: this.arrayAux[i].empresa,
      items: JSON.stringify(this.arrayAux[i].items),
      pendientes: JSON.stringify(this.arrayAux),
    };
    this.navCtrl.navigateForward(['/tabs/en-cierre/en-cierre-detalle'], {
      queryParams: params,
    });
  }

  ionViewWillLeave() {
    this.pendientesSubscription?.unsubscribe();
  }
}
