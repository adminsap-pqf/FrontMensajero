import { Component } from '@angular/core';
import { PendientesProvider } from '../../../../providers/pendientes/pendientes';
import { ComunService } from '../../../../providers/comun/comun';
import { Subscription } from 'rxjs';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-pendientes-list',
  templateUrl: './pendientes-list.component.html',
  styleUrls: ['./pendientes-list.component.scss'],
})
export class PendientesListComponent {
  usuario = this._login.getUsuario();
  arrayAux: any = [];
  pendientes: any[] = [];
  pendientesAgrupados: any[] = [];
  totalPendientes: number = 0;
  pendientesSubscription: Subscription | null = null;
  diaSemana: number = new Date().getDay();
  cargando: boolean = false;

  constructor(
    private _login: ComunService,
    public _pendientes: PendientesProvider,
    // public _router: Router,
    public navCtrl: NavController,
  ) {
  }

  ionViewWillEnter() {
    console.log('El Usuario es: ', this.usuario['usuario']);
    this.arrayAux = [];
    this.totalPendientes = 0;
    this.pendientesAgrupados = [];
    this.pendientes = [];
    this.cargando = true;
    let us = this.usuario['usuario'];
    this.pendientesSubscription = this._pendientes.pendientes(us).subscribe({
      next: (data) => {
        this.cargando = false;
        console.log('data', data.current);
        data.current.forEach((element: any) => {
          this.pendientes.push(element);
        });
        if (this.pendientes != undefined && this.pendientes.length > 0) {
          for (let item of this.pendientes) {
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
              idHorario: 0,
              horario: null,
            };
            if (
              this.pendientesAgrupados != undefined &&
              this.pendientesAgrupados.length > 0
            ) {
              for (let itemPA of this.pendientesAgrupados) {
                if (
                  itemPA.empresa == item.empresa &&
                  itemPA.idHorario == item.idHorario
                ) {
                  repetido = true;

                  if (item.evento == 'Entrega') {
                    let itemRepetido: boolean = false;
                    for (let itemItem of itemPA.items) {
                      if (itemItem.folioEvento == item.folioEvento) {
                        itemRepetido = true;
                        if (
                          itemItem.folioProducto.indexOf(item.folioProducto) ==
                          -1
                        ) {
                          itemItem.folioProducto += ',' + item.folioProducto;
                        }
                        if (
                          itemItem.folioDocumento.indexOf(
                            item.folioDocumento,
                          ) == -1
                        ) {
                          itemItem.folioDocumento += ',' + item.folioDocumento;
                        }
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
                      itemPEndiente.idHorario = item.idHorario;
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
                    itemPEndiente.idHorario = item.idHorario;
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
                itemPEndiente.idHorario = item.idHorario;
                itemPEndiente.horario = item.horario;
                this.pendientesAgrupados.push(itemPEndiente);
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
              itemPEndiente.idHorario = item.idHorario;
              itemPEndiente.horario = item.horario;
              this.pendientesAgrupados?.push(itemPEndiente);
            }
          }
        }

        this.arrayAux = this.arrayAux.concat(this.pendientesAgrupados);
        this.totalPendientes = this.arrayAux.length;
      },
      error: (error) => {
        this.cargando = false;
        console.log(error);
      },
    });
  }

  /**
   * @method entrarAlMapa
   * @param {number} i Posición del arreglo del elemento seleccionado.
   * Navega a la vista del mapa y nevia parametros atravez de la ruta.
   * **/
  entrarAlMapa(i: number) {
    const params = {
      data: JSON.stringify(this.arrayAux[i].coordenada),
      nombre: this.arrayAux[i].empresa,
      direccion: this.arrayAux[i].ruta,
      items: JSON.stringify(this.arrayAux[i].items),
      pendientes: JSON.stringify(this.arrayAux),
    }
    this.navCtrl.navigateForward(['/tabs/pendientes/pendientes-mapa'], {
      queryParams: params,
    });
  }

  ionViewWillLeave() {
    this.pendientesSubscription?.unsubscribe();
  }
}
