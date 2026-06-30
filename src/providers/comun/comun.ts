import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, take, timeout } from 'rxjs/operators';
import {
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { URL } from '../config/config.services'; // Trae las IPs

/**
 * Configuración para ejecutar una petición con indicador de carga,
 * contador regresivo, timeout y manejo de error reintentable.
 */
export interface CargaOpciones<T = any> {
  /** Fábrica que crea la petición. Se invoca de nuevo en cada reintento. */
  crearPeticion: () => Observable<T>;
  /** Se ejecuta cuando el servidor confirma la operación. */
  onSuccess: (data: T) => void;
  /** Se ejecuta si el usuario cierra el error sin reintentar. */
  onError?: () => void;
  /**
   * Verificación opcional ante un error/timeout: debe emitir `true` si la
   * operación realmente se completó en el servidor (para no duplicar).
   */
  verificarEstado?: () => Observable<boolean>;
  /** Mensaje principal mostrado en el indicador de carga. */
  mensaje?: string;
  /** Segundos de espera antes de cortar por timeout (por defecto 30). */
  segundosTimeout?: number;
}

@Injectable({
  providedIn: 'root', // Usamos 'providedIn' para registrar el servicio en el inyector raíz
})
export class ComunService {
  private apiURL: string = `${URL}validaUsuario`;

  moverAcierre: boolean = false;
  RefreshList: boolean = false;
  RefreshListVisitas: boolean = false;
  Usuario: any;
  idVentana: string = '';
  informacion: object = {};
  campoTexto: string = '';
  text: string = '';
  name: string = '';
  height: number = 0;
  idContacto: number = 0;
  tipoSolicitud: string = '';
  razones: string = '';
  cliente: string = '';
  solicitante: string = '';

  usuario: string = '';
  // loginForm: FormGroup;

  constructor(
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {}

  /**
   * Ejecuta una petición mostrando un indicador de carga que NO se cierra por
   * tiempo, sino cuando el servidor responde. Incluye contador regresivo,
   * timeout configurable y manejo de error reintentable. La navegación debe
   * hacerse en `onSuccess` para no avanzar antes de la confirmación real.
   */
  async ejecutarConCarga<T>(opciones: CargaOpciones<T>): Promise<void> {
    const mensaje = opciones.mensaje ?? 'Enviando información…';
    const segundos = opciones.segundosTimeout ?? 30;

    const loading = await this.loadingCtrl.create({
      spinner: 'circles',
      backdropDismiss: false,
      message: this.mensajeCarga(mensaje, segundos),
    });
    await loading.present();

    let restante = segundos;
    const intervalo = setInterval(() => {
      restante = restante > 0 ? restante - 1 : 0;
      loading.message = this.mensajeCarga(mensaje, restante);
    }, 1000);

    const cerrarCarga = async () => {
      clearInterval(intervalo);
      try {
        await loading.dismiss();
      } catch (e) {
        /* ya cerrado */
      }
    };

    opciones
      .crearPeticion()
      .pipe(timeout(segundos * 1000), take(1))
      .subscribe({
        next: async (data) => {
          await cerrarCarga();
          opciones.onSuccess(data);
        },
        error: async (error) => {
          await cerrarCarga();
          if (opciones.verificarEstado) {
            this.verificarYResolver(error, opciones);
          } else {
            this.mostrarError(error, opciones);
          }
        },
      });
  }

  /**
   * Ante un error/timeout, consulta si la operación sí se completó en el
   * servidor. Si fue así, la trata como éxito; si no, muestra el error.
   */
  private async verificarYResolver<T>(
    error: any,
    opciones: CargaOpciones<T>,
  ): Promise<void> {
    const verificando = await this.loadingCtrl.create({
      spinner: 'circles',
      backdropDismiss: false,
      message: 'Verificando si la operación se completó…',
    });
    await verificando.present();

    opciones
      .verificarEstado!()
      .pipe(take(1))
      .subscribe({
        next: async (yaCompletado: boolean) => {
          try {
            await verificando.dismiss();
          } catch (e) {
            /* ya cerrado */
          }
          if (yaCompletado) {
            opciones.onSuccess(undefined as unknown as T);
          } else {
            this.mostrarError(error, opciones);
          }
        },
        error: async () => {
          try {
            await verificando.dismiss();
          } catch (e) {
            /* ya cerrado */
          }
          this.mostrarError(error, opciones);
        },
      });
  }

  /** Toast breve + alerta con opciones Reintentar / Mostrar log / Cerrar. */
  private async mostrarError<T>(
    error: any,
    opciones: CargaOpciones<T>,
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: 'No se pudo finalizar, intenta de nuevo.',
      duration: 3000,
      color: 'danger',
      position: 'bottom',
    });
    await toast.present();

    const alerta = await this.alertCtrl.create({
      header: 'No se pudo completar',
      message:
        'El servidor no respondió o el sistema está saturado. Puedes reintentar o ver el detalle del error.',
      backdropDismiss: false,
      buttons: [
        {
          text: 'Mostrar log',
          handler: () => {
            this.mostrarLog(error, opciones);
          },
        },
        {
          text: 'Cerrar',
          role: 'cancel',
          handler: () => {
            opciones.onError?.();
          },
        },
        {
          text: 'Reintentar',
          handler: () => {
            this.ejecutarConCarga(opciones);
          },
        },
      ],
    });
    await alerta.present();
  }

  /** Muestra el detalle técnico del error, también con opción de reintentar. */
  private async mostrarLog<T>(
    error: any,
    opciones: CargaOpciones<T>,
  ): Promise<void> {
    const alerta = await this.alertCtrl.create({
      header: 'Detalle del error',
      message: this.formatearError(error),
      backdropDismiss: false,
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel',
          handler: () => {
            opciones.onError?.();
          },
        },
        {
          text: 'Reintentar',
          handler: () => {
            this.ejecutarConCarga(opciones);
          },
        },
      ],
    });
    await alerta.present();
  }

  private formatearError(error: any): string {
    if (error?.name === 'TimeoutError') {
      return 'Tiempo de espera agotado: el servidor no respondió dentro del tiempo límite. Es posible que el sistema esté saturado.';
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error?.message) {
      return error.message;
    }
    try {
      return JSON.stringify(error);
    } catch (e) {
      return 'Error desconocido.';
    }
  }

  private mensajeCarga(base: string, segundos: number): string {
    return `${base}<br><small>Si el sistema está saturado puede tardar.</small><br><strong>Espera: ${segundos}s</strong>`;
  }

  /**
   * Realiza la validación del usuario con su username y password.
   */
  login(username: string, password: string): Observable<any> {
    const user = {
      usuario: username,
      password: password,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http.post<any>(this.apiURL, user, { headers }).pipe(
      map((response) => {
        console.log('Login response:', response);
        this.setUsuario(response?.current);
        return response;
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(() => new Error(error.message || 'Server error'));
      }),
    );
  }

  // Métodos para gestionar datos de usuario
  setUsuario(usuario: any): void {
    this.Usuario = usuario;
  }

  /**
   * @method logout Limpia los datos de la sesión en memoria al cerrar sesión.
   */
  logout(): void {
    this.Usuario = null;
    this.usuario = '';
    this.moverAcierre = false;
    this.RefreshList = false;
    this.RefreshListVisitas = false;
    this.informacion = {};
  }

  getUsuario(): any {
    return this.Usuario;
  }

  getMoverCierre(): boolean {
    return this.moverAcierre;
  }

  setMoverCierre(nuevoMover: boolean): void {
    this.moverAcierre = nuevoMover;
  }

  getRefreshList(): boolean {
    return this.RefreshList;
  }

  setRefreshList(refresh: boolean): void {
    this.RefreshList = refresh;
  }

  setAlterRegreshList(refresh: boolean): Promise<void> {
    return new Promise((resolve) => {
      this.RefreshList = refresh;
      resolve();
    });
  }

  getRefreshListVisitas(): boolean {
    return this.RefreshListVisitas;
  }

  setRefreshListVisitas(refresh: boolean): void {
    this.RefreshListVisitas = refresh;
  }
}
