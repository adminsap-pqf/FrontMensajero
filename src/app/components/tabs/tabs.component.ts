import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { ComunService } from '../../../providers/comun/comun';

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
export class TabsComponent {
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

  constructor(
    // DOCS: no utilizar router para apps
    // private router: Router,
    // DOCS: utilizar NavController para apps
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private comun: ComunService,
  ) {}

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
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Seguro que deseas salir?',
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
