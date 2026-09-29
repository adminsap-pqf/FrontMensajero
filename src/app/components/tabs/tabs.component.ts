import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  AlertController,
  NavController,
  ToastController,
} from '@ionic/angular';
import { ComunService } from '../../../providers/comun/comun';
import {
  EvidenciasService,
  ResumenEvidencias,
} from '../../../providers/evidencias/evidencias';

interface ITabOption {
  id: number;
  name: string;
  defaultIcon: string;
  selectedIcon: string;
  selected: boolean;
  url?: string;
}

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
})
export class TabsComponent implements OnInit, OnDestroy {
  tabOptions: Array<ITabOption> = [
    {
      id: 1,
      name: 'Colectar',
      url: 'colectar/colectar-list',
      defaultIcon: 'assets/img/imgs2/icono_colectar_gris.svg',
      selectedIcon: 'assets/img/imgs2/icono_colectar_verde.svg',
      selected: true,
    },
    {
      id: 2,
      name: 'Pendientes',
      url: 'pendientes/pendientes-list',
      defaultIcon: 'assets/img/imgs2/menu_pendientes_inactivo.svg',
      selectedIcon: 'assets/img/imgs2/menu_pendientes_select.svg',
      selected: false,
    },
    {
      id: 3,
      name: 'En Cierre',
      url: 'en-cierre/en-cierre-list',
      defaultIcon: 'assets/img/imgs2/menu_cierre_inactivo.svg',
      selectedIcon: 'assets/img/imgs2/menu_cierre_select.svg',
      selected: false,
    },
    {
      id: 4,
      name: 'Cerrados',
      url: 'cerrados/cerrados-list',
      defaultIcon: 'assets/img/imgs2/menu_cierre_inactivo.svg',
      selectedIcon: 'assets/img/imgs2/menu_cierre_select.svg',
      selected: false,
    },
  ];
  selectedTabOption = this.tabOptions[0];
  index: number = 0;
  resumen: ResumenEvidencias = { pendientes: 0, errores: 0, trabajos: [] };
  private resumenSubscription: Subscription | null = null;

  constructor(
    // DOCS: no utilizar router para apps
    // private router: Router,
    // DOCS: utilizar NavController para apps
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private comun: ComunService,
    private evidencias: EvidenciasService,
  ) {}

  ngOnInit(): void {
    this.resumenSubscription = this.evidencias.resumen$.subscribe((r) => {
      if (r.errores > this.resumen.errores) {
        this.avisarError(r.errores);
      }
      this.resumen = r;
    });
  }

  ngOnDestroy(): void {
    this.resumenSubscription?.unsubscribe();
  }

  textoResumen(): string {
    if (this.resumen.errores > 0) {
      const n = this.resumen.errores;
      return `${n} evidencia${n > 1 ? 's' : ''} con error · tocar para ver`;
    }
    const n = this.resumen.pendientes;
    return `Enviando ${n} evidencia${n > 1 ? 's' : ''} en segundo plano…`;
  }

  private async avisarError(errores: number): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: `${errores} evidencia${errores > 1 ? 's' : ''} no se pudo enviar. Toca la barra roja para reintentar.`,
      duration: 4000,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  }

  async verEvidencias(): Promise<void> {
    const etiquetas: { [estado: string]: string } = {
      PENDIENTE: 'En espera',
      SUBIENDO: 'Enviando',
      ENVIADO: 'Procesando en servidor',
      ERROR: 'Error',
    };
    const lineas = this.resumen.trabajos
      .filter((t) => t.estado !== 'COMPLETADO')
      .map((t) => {
        const detalle =
          t.estado === 'ERROR' && t.ultimoError ? ` (${t.ultimoError})` : '';
        return `<b>${t.folioEvento}</b> · ${t.total} foto${t.total > 1 ? 's' : ''} · ${etiquetas[t.estado]}${detalle}`;
      });

    const botones: any[] = [{ text: 'Cerrar', role: 'cancel' }];
    if (this.resumen.errores > 0) {
      botones.push({
        text: 'Reintentar',
        handler: () => {
          this.evidencias.reintentarErrores();
        },
      });
    }

    const alert = await this.alertCtrl.create({
      header: 'Evidencias por enviar',
      message:
        (lineas.join('<br>') || 'No hay evidencias pendientes.') +
        '<br><br><small>Se envían solas en segundo plano, aunque cierres la app. No borres los datos de la app mientras haya pendientes.</small>',
      buttons: botones,
    });
    await alert.present();
  }

  handleTrackBy(index: number, item: ITabOption) {
    return item.id;
  }

  /**
   * @method handleSelectedTab
   * @property {number} id Id de la opción seleccionada
   * @description Itera la lista de opciones del sistema y cambia la bandera {selected} de la opcion seleccionada y navega al mudolo seleccionado.
   * **/
  handleSelectedTab(id: number) {
    this.tabOptions = this.tabOptions.map((o: ITabOption) => {
      if (o.id === id) {
        this.selectedTabOption = {
          ...o,
          selected: true,
        };
      }
      return {
        ...o,
        selected: o.id === id,
      };
    });
    this.navCtrl.navigateRoot([
      `tabs/${this.selectedTabOption.url}`.trim(),
      {
        queryParams: { reload: new Date().getTime() },
      },
    ]);
  }

  /**
   * @method handleLogout Pide confirmación y cierra la sesión, regresando al login.
   * **/
  async handleLogout() {
    const { pendientes, errores } = this.resumen;
    let aviso = '';
    if (errores > 0) {
      aviso = `<br><br><b>Tienes ${errores} evidencia${errores > 1 ? 's' : ''} con error.</b> Revísala${errores > 1 ? 's' : ''} antes de salir.`;
    } else if (pendientes > 0) {
      aviso = `<br><br>Tienes ${pendientes} evidencia${pendientes > 1 ? 's' : ''} por enviar. Se seguirá${pendientes > 1 ? 'n' : ''} enviando en segundo plano; no borres los datos de la app.`;
    }
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Seguro que deseas salir?' + aviso,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir',
          role: 'destructive',
          handler: () => {
            this.comun.logout();
            this.navCtrl.navigateRoot(['/login']);
          },
        },
      ],
    });
    await alert.present();
  }
}
