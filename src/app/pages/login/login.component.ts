import { Component } from '@angular/core';
import { ComunService } from '../../../providers/comun/comun';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  user: string = '';
  password: string = '';
  constructor(
    private toastCtrl: ToastController,
    private _login: ComunService,
    private router: Router,
  ) {}

  /**
   * @description Redirige a la pantalla principal del sistema al iniciar sesión
   * **/
  redirigir() {
    this.router.navigate(['/tabs']).then((r) => {});
  }

  /**
   * @method doLogin Realiza la petición para iniciar sesión si el formulario es correcto
   * **/
  doLogin() {
    if (this.user !== undefined && this.password !== undefined) {
      this._login.login(this.user, this.password).subscribe(
        async (data) => {
          console.log(data);
          if (data.current.nivel > 0) {
            this._login.setUsuario(data.current);
            this.redirigir();
          } else {
            // Mostrar toast para acceso no permitido
            const toast = await this.toastCtrl.create({
              message: 'Este usuario no tiene permitido el acceso',
              duration: 4500,
              position: 'bottom',
            });
            await toast.present();
          }
        },
        async (error) => {
          console.log('Error: ' + error);
          // Mostrar toast para error de inicio de sesión
          const toast = await this.toastCtrl.create({
            message: 'Error al iniciar Sesión',
            duration: 2500,
          });
          await toast.present();
        },
      );
    }
  }
}
