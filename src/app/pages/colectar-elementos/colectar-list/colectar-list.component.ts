import { Component } from '@angular/core';
import { PendientesProvider } from '../../../../providers/pendientes/pendientes';
import { ComunService } from '../../../../providers/comun/comun';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-colectar-list',
  templateUrl: './colectar-list.component.html',
  styleUrls: ['./colectar-list.component.scss'],
})
export class ColectarListComponent {
  usuario = this._login.getUsuario();
  arrayAux: any = [];
  pendientes: any[] = [];
  pendientesAgrupados: any[] = [];
  totalPendientes: number = 0;
  obtenerPendientesCerradosSubscription: Subscription | null = null;

  constructor(
    public _pendientes: PendientesProvider,
    private _login: ComunService,
    // DOCS: no utilizar router para apps
    // private router: Router,
    // DOCS: utilizar NavController para apps
    private navCtrl: NavController,
  ) {
  }

//DOCS: Utilizar ionViewWillEnter en lugar de ngOnInit para apps, eso forza carcargar los datos cada vez que se entra a la vista
  ionViewWillEnter() {
    this.arrayAux = [];
    this.totalPendientes = 0;
    this.pendientes = [];
    this.pendientesAgrupados = [];
    let us = this.usuario['usuario'];

    this.obtenerPendientesCerradosSubscription = this._pendientes
      .elementosColectar(us)
      .subscribe({
        next: (data) => {
          console.log(data.current);
          if (data.current) {
            this.pendientes = [...this.pendientes, ...data.current];
            this.pendientes.forEach((item) => {
              let agrupado = this.pendientesAgrupados.find(
                (pa) =>
                  pa.empresa === item.empresa &&
                  pa.idHorario === item.idHorario,
              );

              if (!agrupado) {
                agrupado = {
                  empresa: item.empresa,
                  eventos: 0,
                  inaplasables: 0,
                  urgentes: 0,
                  normales: 0,
                  ruta: item.direccion,
                  items: [],
                  coordenada: [{lat: item.latitud, lng: item.longitud}],
                  idHorario: item.idHorario,
                };
                this.pendientesAgrupados.push(agrupado);
              }

              // Procesar el item actual
              const itemExistente = agrupado.items.find(
                (i: any) => i.folioEvento === item.folioEvento,
              );

              if (!itemExistente) {
                agrupado.eventos++;
                agrupado.inaplasables +=
                  item.prioridad === 'Inaplazable' ? 1 : 0;
                agrupado.urgentes += item.prioridad === 'Urgente' ? 1 : 0;
                agrupado.normales += item.prioridad === 'Normal' ? 1 : 0;
                agrupado.items.push(item);
              } else {
                if (!itemExistente.folioProducto.includes(item.folioProducto)) {
                  itemExistente.folioProducto += `,${item.folioProducto}`;
                }
                if (
                  !itemExistente.folioDocumento.includes(item.folioDocumento)
                ) {
                  itemExistente.folioDocumento += `,${item.folioDocumento}`;
                }
              }
            });
            // Actualizar métricas
            this.arrayAux = [...this.arrayAux, ...this.pendientesAgrupados];
            this.totalPendientes = this.arrayAux.length;
          }
        },
        error: (error) => {
          console.error(error);
        },
      });
  }

  ionViewWillLeave() {
    this.obtenerPendientesCerradosSubscription?.unsubscribe();
  }

  go(i: number): void {
    // DOCS: Navega hacia adelante en la pila de navegación
    // DOCS: Para nav el json se debe convertir a string
    const params = {items: JSON.stringify(this.arrayAux[i].items)}
    this.navCtrl.navigateForward(['tabs/colectar/colectar-detalle'], {
      queryParams: params,
    });
  }
}
