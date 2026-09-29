import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, take, timeout } from 'rxjs/operators';
import {
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { Network } from '@capacitor/network';
import { URL } from '../config/config.services'; // Trae las IPs

export interface EstadoConexion {
  dispositivo: { conectado: boolean; tipo: string };
  servidor: { estado: 'bueno' | 'lento' | 'sin-respuesta'; ms: number | null };
}

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

  /**
   * Índice del folio cuya evidencia se subió con éxito en escann-docs.
   * cam-scan-content lo lee al regresar (ionViewWillEnter) para marcar la
   * fila como completada SOLO cuando la subida realmente terminó.
   */
  evidenciaSubidaIndex: number | null = null;

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
   * Opción C: envía una lista grande en TANDAS pequeñas, una tras otra, con un
   * overlay bloqueante que muestra el avance ("Cerrando… 3 de 8"). Bloquear la
   * pantalla evita que el usuario vuelva a picar creyendo que no pasó nada.
   *
   * Cada tanda es una petición liviana → el servidor no se satura. Una tanda que
   * falle no detiene al resto: sus folios se marcan como fallidos (siguen "En
   * cierre" en el servidor, así que reintentarlos es seguro por idempotencia).
   *
   * Devuelve el resumen para que la pantalla decida navegar o reintentar solo
   * los faltantes. NO navega ni muestra alertas por su cuenta.
   */
  async ejecutarPorTandas(opciones: {
    items: any[];
    folioDe: (item: any) => string;
    enviarTanda: (tanda: any[]) => Observable<any>;
    tamanoTanda?: number;
    mensaje?: string;
    segundosTimeoutTanda?: number;
  }): Promise<{ total: number; cerrados: number; foliosFallidos: string[] }> {
    const items = opciones.items ?? [];
    const total = items.length;
    // Por defecto 1 folio por tanda: el back actual responde por TODA la tanda
    // (true/403), así que enviando de a 1 se puede aislar cuál cerró y cuál no.
    const tam = opciones.tamanoTanda ?? 1;
    const base = opciones.mensaje ?? 'Cerrando pendientes…';
    const segundos = opciones.segundosTimeoutTanda ?? 30;

    const loading = await this.loadingCtrl.create({
      spinner: 'circles',
      backdropDismiss: false,
      message: this.mensajeProgreso(base, 0, total),
    });
    await loading.present();

    let cerrados = 0;
    const foliosFallidos: string[] = [];

    const tandas: any[][] = [];
    for (let i = 0; i < items.length; i += tam) {
      tandas.push(items.slice(i, i + tam));
    }

    for (const tanda of tandas) {
      let current: any = undefined;
      let huboRespuesta = false;
      try {
        const body = await this.observableAPromesa(
          opciones.enviarTanda(tanda).pipe(timeout(segundos * 1000), take(1)),
        );
        huboRespuesta = body != null;
        current = body?.current;
      } catch (e) {
        // Falla de red/timeout, o error del servidor (ej. NPE → 403): la tanda
        // no se confirmó; sus folios quedan como fallidos para reintentar.
        huboRespuesta = false;
      }

      if (Array.isArray(current)) {
        // Back con Fase 1: detalle por folio [{folioEvento, ok}].
        const okPorFolio: { [folio: string]: boolean } = {};
        for (const r of current) {
          if (r && r.folioEvento) {
            okPorFolio[r.folioEvento] = !!r.ok;
          }
        }
        for (const item of tanda) {
          const folio = opciones.folioDe(item);
          if (okPorFolio[folio]) {
            cerrados++;
          } else {
            foliosFallidos.push(folio);
          }
        }
      } else {
        // Back actual (sin Fase 1): la respuesta aplica a TODA la tanda. Como se
        // envía de a 1 folio, "hubo respuesta OK" = ese folio cerró.
        const tandaOk = huboRespuesta && current !== false;
        for (const item of tanda) {
          const folio = opciones.folioDe(item);
          if (tandaOk) {
            cerrados++;
          } else {
            foliosFallidos.push(folio);
          }
        }
      }

      const procesados = cerrados + foliosFallidos.length;
      loading.message = this.mensajeProgreso(base, procesados, total);
    }

    try {
      await loading.dismiss();
    } catch (e) {
      /* ya cerrado */
    }

    return { total, cerrados, foliosFallidos };
  }

  /** Convierte un Observable de una sola emisión en Promise (sin depender de toPromise). */
  private observableAPromesa<T>(obs: Observable<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      obs.subscribe({
        next: (v) => resolve(v),
        error: (e) => reject(e),
      });
    });
  }

  /** Mensaje del overlay con el avance de tandas. */
  private mensajeProgreso(base: string, hechos: number, total: number): string {
    return `${base}<br><strong>${hechos} de ${total}</strong><br><small>Si el sistema está saturado puede tardar.</small>`;
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

  /**
   * Aviso de cierre PARCIAL: algunos folios se cerraron y otros no. Los que
   * fallaron ya quedaron aislados para reintentar solo esos. El usuario decide
   * reintentar los faltantes o continuar (los cerrados ya están guardados).
   */
  async mostrarCierreParcial(
    cerrados: number,
    total: number,
    onReintentar: () => void,
    onCerrar: () => void,
  ): Promise<void> {
    const faltantes = total - cerrados;
    const toast = await this.toastCtrl.create({
      message: `Se cerraron ${cerrados} de ${total}. Faltan ${faltantes}.`,
      duration: 3000,
      color: 'warning',
      position: 'bottom',
    });
    await toast.present();

    const alerta = await this.alertCtrl.create({
      header: 'Cierre parcial',
      message:
        `Se cerraron ${cerrados} de ${total} pendientes. ` +
        `Faltan ${faltantes} por enviar (el servidor está saturado). ` +
        'Los ya cerrados quedaron guardados; puedes reintentar solo los faltantes.',
      backdropDismiss: false,
      buttons: [
        {
          text: 'Continuar',
          role: 'cancel',
          handler: () => onCerrar(),
        },
        {
          text: 'Reintentar faltantes',
          handler: () => onReintentar(),
        },
      ],
    });
    await alerta.present();
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
      timeout(30000),
      map((response) => {
        console.log('Login response:', response);
        this.setUsuario(response?.current);
        return response;
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(() => error);
      }),
    );
  }

  async verificarConexion(): Promise<EstadoConexion> {
    let dispositivo: EstadoConexion['dispositivo'] = {
      conectado: navigator.onLine,
      tipo: 'unknown',
    };
    try {
      const status = await Network.getStatus();
      dispositivo = {
        conectado: status.connected,
        tipo: status.connectionType,
      };
    } catch (e) {
    }

    if (!dispositivo.conectado) {
      return { dispositivo, servidor: { estado: 'sin-respuesta', ms: null } };
    }

    const inicio = Date.now();
    const controller = new AbortController();
    const limite = setTimeout(() => controller.abort(), 8000);
    try {
      await fetch(URL, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });
      const ms = Date.now() - inicio;
      return {
        dispositivo,
        servidor: { estado: ms <= 2000 ? 'bueno' : 'lento', ms },
      };
    } catch (e) {
      return { dispositivo, servidor: { estado: 'sin-respuesta', ms: null } };
    } finally {
      clearTimeout(limite);
    }
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
