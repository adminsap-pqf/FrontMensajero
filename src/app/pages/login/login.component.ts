import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ComunService,
  EstadoConexion,
} from '../../../providers/comun/comun';
import { LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Network } from '@capacitor/network';
import { PluginListenerHandle } from '@capacitor/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  user: string = '';
  password: string = '';
  verPassword = false;
  enviando = false;
  verificando = false;
  conexion: EstadoConexion | null = null;
  private redListener: PluginListenerHandle | null = null;

  constructor(
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private _login: ComunService,
    private router: Router,
  ) {}

  async ionViewWillEnter() {
    this.revisarConexion();
    try {
      this.redListener = await Network.addListener('networkStatusChange', () =>
        this.revisarConexion(),
      );
    } catch (e) {
    }
  }

  ionViewWillLeave() {
    this.verPassword = false;
    this.redListener?.remove();
    this.redListener = null;
  }

  async revisarConexion(): Promise<EstadoConexion> {
    this.verificando = true;
    try {
      this.conexion = await this._login.verificarConexion();
    } finally {
      this.verificando = false;
    }
    return this.conexion;
  }

  get textoDispositivo(): string {
    if (!this.conexion) return 'Revisando…';
    const d = this.conexion.dispositivo;
    if (!d.conectado) return 'Sin internet';
    if (d.tipo === 'wifi') return 'Conectado (Wi-Fi)';
    if (d.tipo === 'cellular') return 'Conectado (datos)';
    return 'Conectado';
  }

  get textoServidor(): string {
    if (!this.conexion) return 'Revisando…';
    const s = this.conexion.servidor;
    if (s.estado === 'bueno') return `Responde (${s.ms} ms)`;
    if (s.estado === 'lento') return `Lento (${((s.ms ?? 0) / 1000).toFixed(1)} s)`;
    return 'Sin respuesta';
  }

  get colorDispositivo(): string {
    if (!this.conexion) return 'medium';
    return this.conexion.dispositivo.conectado ? 'success' : 'danger';
  }

  get colorServidor(): string {
    if (!this.conexion) return 'medium';
    const e = this.conexion.servidor.estado;
    return e === 'bueno' ? 'success' : e === 'lento' ? 'warning' : 'danger';
  }

  /**
   * @description Redirige a la pantalla principal del sistema al iniciar sesión
   * **/
  redirigir() {
    this.router.navigate(['/tabs']).then((r) => {});
  }

  /**
   * @method doLogin Realiza la petición para iniciar sesión si el formulario es correcto
   * **/
            // Mostrar toast para acceso no permitido
          // Mostrar toast para error de inicio de sesión
  async doLogin() {
    const usuario = (this.user || '').trim();
    if (this.enviando) return;
    if (!usuario || !this.password) {
      this.mostrarToast('Escribe tu usuario y contraseña.');
      return;
    }
    this.user = usuario;
    this.enviando = true;

    const loading = await this.loadingCtrl.create({
      spinner: 'circles',
      message: 'Iniciando sesión…',
      backdropDismiss: false,
    });
    await loading.present();

    this._login.login(usuario, this.password).subscribe(
      async (data) => {
        await loading.dismiss();
        this.enviando = false;
        if (data?.current?.nivel > 0) {
          this._login.setUsuario(data.current);
          this.redirigir();
        } else {
          this.mostrarToast('Este usuario no tiene permitido el acceso', 4500);
        }
      },
      async (error) => {
        await loading.dismiss();
        this.enviando = false;
        const mensaje = await this.mensajeDeError(error);
        this.mostrarToast(mensaje, 6000);
      },
    );
  }

  private async mensajeDeError(error: any): Promise<string> {
    const estado = await this.revisarConexion();

    if (!estado.dispositivo.conectado) {
      return 'Tu teléfono no tiene internet. Revisa tus datos o Wi-Fi.';
    }
    if (estado.servidor.estado === 'sin-respuesta') {
      return 'El servidor no responde. No es tu teléfono; intenta en unos minutos.';
    }
    if (error?.name === 'TimeoutError') {
      return 'El servidor tardó demasiado en responder (posible saturación). Intenta en un momento.';
    }
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se pudo contactar al servidor. Revisa tu conexión e intenta de nuevo.';
      }
      if (error.status === 403 || error.status === 401) {
        return 'Usuario o contraseña incorrectos. Si estás seguro de tus datos, el servidor puede estar saturado: intenta en un momento.';
      }
      if (error.status >= 500) {
        return `Error del servidor (${error.status}). Intenta en un momento.`;
      }
    }
    return 'Error al iniciar sesión. Intenta de nuevo.';
  }

  private async mostrarToast(message: string, duration = 2500) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      position: 'bottom',
    });
    await toast.present();
  }
}
