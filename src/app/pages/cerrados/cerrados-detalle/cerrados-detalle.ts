import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'page-cerrados-detalle',
  templateUrl: 'cerrados-detalle.html',
  styleUrls: ['./cerrados-detalle.scss'],
})
export class CerradosDetallePage {
  items: any[] = [];
  data: any[] = [];
  arrayAux: any = [];
  nombreClientes: any;
  pendientesAgrupados: any[] = [];
  nombreCliente: string = '';
  selectData: number = 0;
  totalEventos: number = 0;
  codigoValido: any = {};

  constructor(private activatedRoute: ActivatedRoute) {
  }

  toggleDetails(data: any, i: number) {
    this.selectData = i;
    if (data.showDetails) {
      data.showDetails = false;
      data.icon = 'chevron-down-outline';
    } else {
      data.showDetails = true;
      data.icon = 'chevron-up-outline';
    }
  }

  ionViewWillEnter() {
    this.activatedRoute.queryParams.subscribe((params: any) => {
      this.data = [];
      this.items = [];
      this.arrayAux = [];
      this.pendientesAgrupados = [];
      this.items = JSON.parse(params?.items || '[]');
      console.log('items on init', this.items);
      if (this.items != undefined && this.items.length > 0) {
        for (let item of this.items) {
          let repetido: Boolean = false;
          let itemPEndiente = {evento: '', eventos: 0, items: []};
          if (
            this.pendientesAgrupados != undefined &&
            this.pendientesAgrupados.length > 0
          ) {
            for (let itemPA of this.pendientesAgrupados) {
              if (itemPA.evento == item.evento) {
                repetido = true;
                itemPA.eventos++;
                itemPA.items.push(item);
                if (item.evento == 'Entrega') {
                  this.totalEventos += item.folioProducto.split(',').length;
                  this.codigoValido[item.evento].push(
                    new Array(item.folioProducto.split(','), length).fill(false),
                  );
                } else {
                  this.totalEventos++;
                  this.codigoValido[item.evento].push(false);
                }
              }
            }
            if (!repetido) {
              itemPEndiente.evento = item.evento;
              itemPEndiente.eventos = 1;
              this.pendientesAgrupados.push(itemPEndiente);
              // @ts-ignore
              itemPEndiente.items.push(item);
              if (item.evento == 'Entrega') {
                if (this.codigoValido[item.evento].length == 0) {
                  this.totalEventos += item.folioProducto.split(',').length;
                  this.codigoValido[item.evento] = [
                    new Array(item.folioProducto.split(','), length).fill(false),
                  ];
                } else {
                  this.totalEventos += item.folioProducto.split(',').length;
                  this.codigoValido[item.evento].push(
                    new Array(item.folioProducto.split(','), length).fill(false),
                  );
                }
              } else {
                if ((this.codigoValido[item.evento]?.length || 0) === 0) {
                  this.totalEventos++;
                  this.codigoValido[item.evento] = [false];
                } else {
                  this.totalEventos++;
                  this.codigoValido[item.evento].push(false);
                }
              }
            }
          } else {
            itemPEndiente.evento = item.evento;
            itemPEndiente.eventos = 1;
            // @ts-ignore
            itemPEndiente.items.push(item);
            this.pendientesAgrupados.push(itemPEndiente);
            if (item.evento == 'Entrega') {
              this.totalEventos += item.folioProducto.split(',').length;
              this.codigoValido[item.evento] = [
                new Array(item.folioProducto.split(','), length).fill(false),
              ];
            } else {
              this.totalEventos++;
              this.codigoValido[item.evento] = [false];
            }
          }
        }
      }

      this.arrayAux = this.arrayAux.concat(this.pendientesAgrupados);
      for (let i = 0; i < this.arrayAux.length; i++) {
        // aux = this.categorias[i].pakinglist;
        this.data.push({
          title: this.arrayAux[i].evento,
          details: (this.arrayAux[i].items as any[]).map((item) => {
            // DOCS: vemos que no se dupliquen los folios folioProducto de la candena de string
            item.folioProducto = item.folioProducto
              .split(',')
              .filter((x: any, index: any, self: any) => self.indexOf(x) === index)
              .join(',');
            return item;
          }),
          eventos: this.arrayAux[i].eventos,
          icon: 'chevron-down-outline',
          showDetails: false,
        });
      }
      console.log('items', this.data);
    });
  }

  ionViewWillLeave() {
  }
}
