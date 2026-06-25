import { Component } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AccesoService } from '../../../providers/acceso/acceso';

@Component({
  selector: 'app-activacion',
  templateUrl: './activacion.component.html',
  styleUrls: ['./activacion.component.scss'],
})
export class ActivacionComponent {
  codigo: string = '';
  validando: boolean = false;
  expiraVigente: Date | null = null;

  constructor(
    private toastCtrl: ToastController,
    private acceso: AccesoService,
    private router: Router,
  ) {}

  ionViewWillEnter() {
    // Si ya hay acceso vigente, mostrar hasta cuándo.
    this.expiraVigente = this.acceso.getExpiracion();
    if (this.acceso.tieneAccesoVigente()) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Valida el código ingresado. Si es correcto, entra a la app.
   */
  async activar() {
    if (!this.codigo || !this.codigo.trim()) {
      await this.mostrar('Ingresa tu código de acceso');
      return;
    }

    this.validando = true;
    try {
      const resultado = await this.acceso.validarYGuardar(this.codigo);

      if (resultado.valido) {
        await this.mostrar('Acceso activado correctamente', 2000);
        this.router.navigate(['/login']);
        return;
      }

      switch (resultado.motivo) {
        case 'expirado':
          await this.mostrar(
            'Este código ya expiró. Solicita uno nuevo.',
            4000,
          );
          break;
        case 'firma':
        case 'formato':
        default:
          await this.mostrar('Código inválido. Verifica e inténtalo de nuevo.');
          break;
      }
    } catch (e) {
      console.error('Error validando código de acceso:', e);
      await this.mostrar('No se pudo validar el código. Intenta de nuevo.');
    } finally {
      this.validando = false;
    }
  }

  private async mostrar(message: string, duration: number = 3000) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      position: 'bottom',
    });
    await toast.present();
  }
}
