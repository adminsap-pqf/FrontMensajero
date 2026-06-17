import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-colectar-detalles',
  templateUrl: './colectar-detalles.component.html',
  styleUrls: ['./colectar-detalles.component.scss'],
})
export class ColectarDetallesComponent {
  items: any[] = [];

  arrayAux: any = [];
  nombreClientes: any;
  pendientesAgrupados: any[] = [];

  constructor(
    // DOCS: no utilizar router para apps
    private router: Router,
    // DOCS: utilizar NavController para apps
    private navCtrl: NavController,
    // DOCS: utilizar ActivatedRoute para obtener parametros de la URL con NavParams
    private activatedRoute: ActivatedRoute,
  ) {
  }

//DOCS: Utilizar ionViewWillEnter en lugar de ngOnInit para apps, eso forza carcargar los datos cada vez que se entra a la vista
  ionViewWillEnter() {
    console.log('ionViewWillEnter - colectar-detalles');
    // DOCS: Asi se obtienen los parametros de la URL por medio de ActivatedRoute usando NavController
    this.activatedRoute.queryParams.subscribe((params: any) => {
      this.items = JSON.parse(params?.items);
      this.agruparDatos();
    });
  }

  agruparDatos() {
    this.arrayAux = [];
    this.pendientesAgrupados = [];
    this.nombreClientes = this.items[0]?.empresa;

    if (this.items && this.items.length > 0) {
      for (let item of this.items) {
        let repetido: boolean = false;
        let itemPendiente = {evento: '', eventos: 0, items: []};

        if (this.pendientesAgrupados?.length > 0) {
          for (let itemPA of this.pendientesAgrupados) {
            if (itemPA.evento === item.evento) {
              repetido = true;
              itemPA.eventos++;
              itemPA.items.push(item);
            }
          }
          if (!repetido) {
            itemPendiente.evento = item.evento;
            itemPendiente.eventos = 1;
            // @ts-ignore
            itemPendiente.items.push(item);
            this.pendientesAgrupados.push(itemPendiente);
          }
        } else {
          itemPendiente.evento = item.evento;
          itemPendiente.eventos = 1;
          // @ts-ignore
          itemPendiente.items.push(item);
          this.pendientesAgrupados.push(itemPendiente);
        }
      }
    }

    this.arrayAux = this.arrayAux.concat(this.pendientesAgrupados);
  }

  goto(items: any) {
    const params = {items: JSON.stringify(items.items), nombre: this.nombreClientes};
    // DOCS: utilizar navigateForward para navegar hacia adelante
    this.navCtrl.navigateForward(['tabs/colectar/colectar-escann'], {
      queryParams: params,
    });
  }
}
