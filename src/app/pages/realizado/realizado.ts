import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { ComunService } from '../../../providers/comun/comun';
import { PendientesProvider } from '../../../providers/pendientes/pendientes';
import { Subscription } from 'rxjs';

@Component({
    selector: 'realizado',
    templateUrl: 'realizado.html',
    styleUrls: ['realizado.scss'],
})
export class RealizadoPage {
    idCliente!: number;
    item = [];
    noRealizados!: any[];
    nombreReceptor: string = '';
    numero: number = 0;
    openbottom2: boolean = false;
    openbottom: boolean = false;
    posi!: number;
    queryParamsSubscription: Subscription | null = null;
    realizados!: any[];
    receptorSeleceted = 2000;
    receptoresList: any[] = [];
    usuario = this._login.getUsuario();

    constructor(
        private _login: ComunService,
        private navCtrl: NavController,
        private route: ActivatedRoute,
        private _pendientes: PendientesProvider,
    ) {
        this.queryParamsSubscription = this.route.queryParams.subscribe(
            (params) => {
                this.realizados = JSON.parse(params['realizados']) || [];
                this.noRealizados = JSON.parse(params['noRealizados']) || [];
            },
        );
    }

    ionViewWillEnter() {
        console.log('Realizados -> ', this.realizados);
        console.log('No realizados -> ', this.noRealizados);
        this.loadReceptores();
    }

    private loadReceptores() {
        this.receptoresList = [];

        if (this.realizados && this.realizados.length > 0) {
            this._pendientes
                .clientes(this.realizados[0].idCliente)
                .subscribe((data: any) => {
                    console.log(data);
                    data.current.forEach((element: any) => {
                        this.receptoresList.push(element);
                    });
                });
        }
    }

    selectReceptor(i: any) {
        this.receptorSeleceted = i;
        this.openbottom = true;
        this.nombreReceptor = this.receptoresList[i].nombre;
        this.item = this.receptoresList[i];
    }

    esconder() {
        this.openbottom = false;
    }

    BorrarReceptor(i: any) {
        this.numero = i;
        this.openbottom2 = true;
        this.nombreReceptor = this.receptoresList[i].nombre;
    }

    receptor() {
        this.navCtrl.navigateForward(['tabs/en-cierre/agregar-receptor'], {
            queryParams: {
                idCliente: this.realizados[0].idCliente,
            },
        });
    }

    enviarAFirma() {
        let lstPendientesTrue: any[] = [];
        let lstPendientesFalse: any[] = [];

        for (let i = 0; i < this.realizados.length; i++) {
            this.realizados[i].personaRecibio =
                this.receptoresList[this.receptorSeleceted].nombre;
            this.realizados[i].puestoPersonaRecibio =
                this.receptoresList[this.receptorSeleceted].puesto;
            this.realizados[i].realizadoTxt = 'Realizada';
            lstPendientesTrue.push(Object.assign(this.realizados[i]));
        }

        for (let i = 0; i < this.noRealizados.length; i++) {
            this.noRealizados[i].realizadoTxt = 'No realizada';
            lstPendientesFalse.push(Object.assign(this.noRealizados[i]));
        }

        console.log(lstPendientesTrue, lstPendientesFalse);
        let tipoEvento: string = lstPendientesTrue[0].folioEvento.substr(0, 2);
        const params = {
            realizados: lstPendientesTrue,
            noRealizados: lstPendientesFalse,
            codigoValido: new Array(lstPendientesTrue.length).fill(false),
            entregaRevision: new Array(lstPendientesFalse.length).fill(false),
        };
        console.log('params', params);
        this.navCtrl.navigateForward('/tabs/en-cierre/cam-scann', {
            queryParams: params,
        });
    }

    eliminar() {
        let arrayAux: any[] = [];

        this.receptoresList[this.numero].borrar = true;
        arrayAux.push(Object.assign(this.receptoresList[this.numero]));

        this._pendientes.actualizarCliente(arrayAux).subscribe((data: any) => {
            this.receptoresList.splice(this.numero, 1);
        });

        this.openbottom2 = false;
    }

    esconder2() {
        this.openbottom2 = false;
    }

    ionViewWillLeave() {
        this.queryParamsSubscription?.unsubscribe();
    }
}
