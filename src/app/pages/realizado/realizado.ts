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
    item: any = [];
    noRealizados!: any[];
    nombreReceptor: string = '';
    openbottom2: boolean = false;
    openbottom: boolean = false;
    posi!: number;
    queryParamsSubscription: Subscription | null = null;
    realizados!: any[];
    // Selección por objeto (no por índice) para que funcione con la lista filtrada.
    receptorSeleccionado: any = null;
    receptorABorrar: any = null;
    receptoresList: any[] = [];
    receptoresFiltrados: any[] = [];
    textoBusqueda: string = '';
    cargando: boolean = false;
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
        this.receptoresFiltrados = [];

        if (this.realizados && this.realizados.length > 0) {
            this.cargando = true;
            this._pendientes
                .clientes(this.realizados[0].idCliente)
                .subscribe({
                    next: (data: any) => {
                        this.cargando = false;
                        console.log(data);
                        data.current.forEach((element: any) => {
                            this.receptoresList.push(element);
                        });
                        this.aplicarFiltro();
                    },
                    error: (error: any) => {
                        this.cargando = false;
                        console.log(error);
                    },
                });
        }
    }

    buscarReceptor(event: any) {
        this.textoBusqueda =
            event?.detail?.value ?? event?.target?.value ?? '';
        this.aplicarFiltro();
    }

    /** Minúsculas y sin acentos, para buscar por similitud sin exactitud. */
    private normalizar(txt: any): string {
        return String(txt ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '');
    }

    /**
     * Filtra por nombre y puesto: cada palabra escrita debe aparecer en el
     * receptor (sin importar mayúsculas, acentos ni el orden de las palabras).
     */
    aplicarFiltro() {
        const consulta = this.normalizar(this.textoBusqueda).trim();
        if (!consulta) {
            this.receptoresFiltrados = [...this.receptoresList];
            return;
        }
        const palabras = consulta.split(/\s+/);
        this.receptoresFiltrados = this.receptoresList.filter((r) => {
            const texto =
                this.normalizar(r.nombre) + ' ' + this.normalizar(r.puesto);
            return palabras.every((p) => texto.includes(p));
        });
    }

    selectReceptor(receptor: any) {
        this.receptorSeleccionado = receptor;
        this.openbottom = true;
        this.nombreReceptor = receptor.nombre;
        this.item = receptor;
    }

    esconder() {
        this.openbottom = false;
    }

    BorrarReceptor(receptor: any) {
        this.receptorABorrar = receptor;
        this.openbottom2 = true;
        this.nombreReceptor = receptor.nombre;
    }

    receptor() {
        this.navCtrl.navigateForward(['tabs/en-cierre/agregar-receptor'], {
            queryParams: {
                idCliente: this.realizados[0].idCliente,
            },
        });
    }

    enviarAFirma() {
        if (!this.receptorSeleccionado) {
            return;
        }

        let lstPendientesTrue: any[] = [];
        let lstPendientesFalse: any[] = [];

        for (let i = 0; i < this.realizados.length; i++) {
            this.realizados[i].personaRecibio =
                this.receptorSeleccionado.nombre;
            this.realizados[i].puestoPersonaRecibio =
                this.receptorSeleccionado.puesto;
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
        if (!this.receptorABorrar) {
            this.openbottom2 = false;
            return;
        }

        const receptor = this.receptorABorrar;
        receptor.borrar = true;

        this._pendientes
            .actualizarCliente([receptor])
            .subscribe((data: any) => {
                if (data?.current !== true) {
                    receptor.borrar = false;
                    return;
                }
                const idx = this.receptoresList.indexOf(receptor);
                if (idx > -1) {
                    this.receptoresList.splice(idx, 1);
                }
                if (this.receptorSeleccionado === receptor) {
                    this.receptorSeleccionado = null;
                }
                this.aplicarFiltro();
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
