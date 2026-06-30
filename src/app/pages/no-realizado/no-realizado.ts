import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ComunService } from '../../../providers/comun/comun';
import { PendientesProvider } from '../../../providers/pendientes/pendientes';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'no-realizado',
  templateUrl: 'no-realizado.html',
  styleUrls: ['no-realizado.scss'],
})
export class NoRealizadoPage {
  reasonSelected = 1000;
  usuario = this._login.getUsuario();
  showRazon: boolean = false;
  showDesc: boolean = false;
  showLista: boolean = true;
  pakinglist: any[] = [];
  pendientes: any[] = [];
  razones: any[] = [];
  totalFolio: number = 0;
  write: boolean = true;
  noRealizados: any[] = [];
  codigoValido: any[] = [];
  justificaciones: any[] = [];
  i: any = undefined;
  i2: any = undefined;
  txtAux: any = '';
  isRealizados: Boolean = false;
  finalizando: boolean = false;
  queryParamsSubscription: Subscription | null = null;
  pendientesSubscription: Subscription | null = null;

  private todo: FormGroup;

  constructor(
    public navCtrl: NavController,
    private _login: ComunService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public _pendientes: PendientesProvider,
  ) {
    this.todo = this.formBuilder.group({
      description: [''],
    });
    this.queryParamsSubscription = this.route.queryParams.subscribe({
      next: (params) => {
        this.noRealizados = JSON.parse(params['noRealizados']);
        this.isRealizados = JSON.parse(params['isRealizados']);
        let cont = 0;
        for (let item of this.noRealizados) {
          if (item.evento != 'Entrega') {
            this.codigoValido.push(false);
            this.justificaciones.push({ razon: '', justificacion: '' });
          } else {
            this.codigoValido.push([]);
            this.justificaciones.push([]);
            for (let item2 of item.folioProducto.split(',')) {
              this.codigoValido[cont].push(false);
              this.justificaciones[cont].push({ razon: '', justificacion: '' });
            }
            cont++;
          }
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }
  ionViewWillEnter() {
    this.razones = [
      {
        nombre: 'Mensajero',
        desc: 'No se ha realizado por falta de tiempo, por tráfico, tiempo, etc. ',
      },
      {
        nombre: 'Solicitante',
        desc: 'Las instrucciones el solicitante eran incorrectas. ',
      },
      {
        nombre: 'Cliente',
        desc: 'El cliente ha provocado la no realización del evento',
      },
    ];
    this.pendientes = [
      { folio: '00092836237' },
      { folio: '00092836238' },
      { folio: '00092836238' },
    ];
    this.pakinglist = [
      { clave: 'PL-000001-00000', pendientes: this.pendientes },
    ];
    this.totalFolio = this.pendientes.length;
  }

  selectReceptor(i: any) {
    this.reasonSelected = i;
  }

  abrirRazones(i: any, i2: any) {
    this.i = i;
    this.i2 = i2;
    console.log(this.i, this.i2);
    this.showLista = false;
    this.showRazon = true;
    this.showDesc = false;
  }

  AbrirJustificacion(razon: any) {
    this.showLista = false;
    this.showRazon = false;
    this.showDesc = true;
    if (this.i2 == undefined) {
      this.justificaciones[this.i] =
        this.justificaciones[this.i].razon != razon
          ? {
              razon: razon,
              justificacion: '',
            }
          : {
              razon: razon,
              justificacion: this.justificaciones[this.i].justificacion,
            };
      this.txtAux = this.justificaciones[this.i].justificacion;
    } else {
      this.justificaciones[this.i][this.i2] =
        this.justificaciones[this.i][this.i2].razon != razon
          ? {
              razon: razon,
              justificacion: '',
            }
          : {
              razon: razon,
              justificacion:
                this.justificaciones[this.i][this.i2].justificacion,
            };
      this.txtAux = this.justificaciones[this.i][this.i2].justificacion;
    }
  }

  cancelar() {
    this.showLista = true;
    this.showRazon = false;
    this.showDesc = false;
  }

  aceptar() {
    if (this.i2 == undefined) {
      this.codigoValido[this.i] = true;
    } else {
      this.codigoValido[this.i][this.i2] = true;
    }
    this.showLista = true;
    this.showRazon = false;
    this.showDesc = false;
    console.log(this.justificaciones);
    console.log(this.codigoValido);
  }

  txtTextArea($event: any) {
    console.log($event);
    if (this.i2 == undefined) {
      this.justificaciones[this.i].justificacion = $event;
    } else {
      this.justificaciones[this.i][this.i2].justificacion = $event;
    }
  }

  finalizado() {
    console.log(this.noRealizados);
    let finalizar: boolean = true;
    const esEntrega = this.noRealizados[0].evento == 'Entrega';

    // Validación de que todos los folios tengan justificación.
    if (!esEntrega) {
      for (let item of this.codigoValido) {
        if (!item) {
          finalizar = false;
        }
      }
    } else {
      for (let item of this.codigoValido) {
        for (let item2 of item) {
          if (!item2) {
            finalizar = false;
          }
        }
      }
    }

    if (!finalizar) {
      return;
    }

    // Evita toques repetidos mientras la operación está en curso.
    if (this.finalizando) {
      return;
    }
    this.finalizando = true;

    // Arma las peticiones según el tipo de evento, pero la navegación ocurre
    // una sola vez y solo cuando el servidor confirma (dentro de onSuccess).
    let peticiones: Observable<any>[] = [];

    if (!esEntrega) {
      let cont = 0;
      for (let item of this.noRealizados) {
        item.tipoJustificacion = this.justificaciones[cont].razon;
        item.justificacion = this.justificaciones[cont].justificacion;
        cont++;
      }
      peticiones.push(
        this._pendientes.cerrarRuta(
          this.noRealizados,
          this.usuario['idEmpleado'],
          this.usuario['usuario'],
        ),
      );
    } else {
      if (!this.isRealizados) {
        let i = 0;
        for (let item of this.noRealizados) {
          item.tipoJustificacion = this.justificaciones[i][0].razon;
          item.justificacion = this.justificaciones[i][0].justificacion;
          item.extra = null;
          item.realizadoTxt = 'No realizada';
          i++;
        }
        peticiones.push(
          this._pendientes.cerrarRuta(
            this.noRealizados,
            this.usuario['idEmpleado'],
            this.usuario['usuario'],
          ),
        );
      }

      let lstComentaiosRutaDP: any[] = [];
      let cont = 0;
      for (let item of this.noRealizados) {
        let cont2 = 0;
        for (let item2 of item.folioProducto.split(',')) {
          let comentaiosRutaDP: any = {
            razonesEntrega: this.justificaciones[cont][cont2].razon,
            tipoJustificacion: this.justificaciones[cont][cont2].justificacion,
            rutaDP: item.folioEvento,
            folioFactura: item2,
          };
          lstComentaiosRutaDP.push(comentaiosRutaDP);
          cont2++;
        }
        cont++;
      }
      peticiones.push(
        this._pendientes.cerrarRutaDPNoRealizados(lstComentaiosRutaDP),
      );
    }

    this._login.ejecutarConCarga({
      mensaje: 'Finalizando…',
      crearPeticion: () => forkJoin(peticiones),
      verificarEstado: () => this.verificarCierre(),
      onSuccess: () => {
        this.finalizando = false;
        this.navCtrl.navigateRoot(['tabs/en-cierre']);
      },
      onError: () => {
        // Se queda en la pantalla para reintentar sin perder la captura.
        this.finalizando = false;
      },
    });
  }

  /**
   * Verifica si el cierre ya se completó: si ninguno de los folios sigue en la
   * lista "En cierre", el servidor ya procesó la operación.
   */
  private verificarCierre(): Observable<boolean> {
    return this._pendientes.enCierre(this.usuario['usuario']).pipe(
      map((resp: any) => {
        const lista: any[] = resp?.current ?? [];
        const folios = this.noRealizados.map((r: any) => r.folioEvento);
        const siguenAbiertos = lista.some((p: any) =>
          folios.includes(p.folioEvento),
        );
        return !siguenAbiertos;
      }),
    );
  }

  ionViewWillLeave() {
    this.queryParamsSubscription?.unsubscribe();
    this.pendientesSubscription?.unsubscribe();
  }
}
