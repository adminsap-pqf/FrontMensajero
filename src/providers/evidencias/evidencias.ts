import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { take, timeout } from 'rxjs/operators';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Network } from '@capacitor/network';
import { Photo } from '@capacitor/camera';
import { EVIDENCIA_PROTOCOLO, URL } from '../config/config.services';

export type EstadoEvidencia =
  | 'PENDIENTE'
  | 'SUBIENDO'
  | 'ENVIADO'
  | 'COMPLETADO'
  | 'ERROR';

export interface TrabajoEvidencia {
  version: 1;
  idSubida: string;
  folioEvento: string;
  valor: string;
  tipo: 'RT';
  total: number;
  protocolo: 'legacy' | 'v2';
  urlBase: string;
  estado: EstadoEvidencia;
  intentos: number;
  subidas: number[];
  creado: number;
  actualizado: number;
  ultimoError: string | null;
}

export interface FotoLocal {
  archivo: string;
  src: string;
}

export interface ResumenEvidencias {
  pendientes: number;
  errores: number;
  trabajos: TrabajoEvidencia[];
}

interface EvidenciasColaPlugin {
  procesar(): Promise<void>;
}
const EvidenciasCola = registerPlugin<EvidenciasColaPlugin>('EvidenciasCola');

const RAIZ = 'evidencias';
const BORRADORES = `${RAIZ}/borradores`;
const COLA = `${RAIZ}/cola`;
const MANIFIESTO = 'trabajo.json';
const MAX_INTENTOS = 5;
const RETENCION_COMPLETADOS_MS = 3 * 24 * 60 * 60 * 1000;
const SUBIENDO_ABANDONADO_MS = 10 * 60 * 1000;
const SEGUNDOS_TIMEOUT_LEGACY = 300;
const SEGUNDOS_TIMEOUT_FOTO = 90;

@Injectable({
  providedIn: 'root',
})
export class EvidenciasService {
  private readonly resumenSubject = new BehaviorSubject<ResumenEvidencias>({
    pendientes: 0,
    errores: 0,
    trabajos: [],
  });
  readonly resumen$: Observable<ResumenEvidencias> =
    this.resumenSubject.asObservable();

  private iniciado = false;
  private refrescando = false;
  private procesandoWeb = false;
  private ultimaConsultaEstado = 0;

  constructor(
    private http: HttpClient,
    private zone: NgZone,
  ) {}

  iniciar(): void {
    if (this.iniciado) {
      return;
    }
    this.iniciado = true;

    this.procesar();
    this.refrescar();
    setInterval(() => this.refrescar(), 5000);

    Network.addListener('networkStatusChange', (estado) => {
      if (estado.connected) {
        this.procesar();
      }
    }).catch(() => undefined);

    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        this.procesar();
        this.refrescar();
      }
    }).catch(() => undefined);
  }

  get resumen(): ResumenEvidencias {
    return this.resumenSubject.value;
  }


  async guardarFoto(foto: Photo): Promise<FotoLocal> {
    await this.asegurarDirectorio(BORRADORES);
    const archivo = `${BORRADORES}/${this.nuevoId()}.jpg`;

    if (Capacitor.isNativePlatform() && foto.path) {
      await Filesystem.copy({
        from: foto.path,
        to: archivo,
        toDirectory: Directory.Data,
      });
      Filesystem.deleteFile({ path: foto.path }).catch(() => undefined);
      const { uri } = await Filesystem.getUri({
        path: archivo,
        directory: Directory.Data,
      });
      return { archivo, src: Capacitor.convertFileSrc(uri) };
    }

    const blob = await (await fetch(foto.webPath!)).blob();
    await Filesystem.writeFile({
      path: archivo,
      data: await this.blobABase64(blob),
      directory: Directory.Data,
    });
    return { archivo, src: foto.webPath! };
  }

  async descartarFotos(fotos: FotoLocal[]): Promise<void> {
    for (const foto of fotos) {
      await Filesystem.deleteFile({
        path: foto.archivo,
        directory: Directory.Data,
      }).catch(() => undefined);
    }
  }


  async encolar(datos: {
    folioEvento: string;
    valor: string;
    fotos: FotoLocal[];
  }): Promise<TrabajoEvidencia> {
    const idSubida = this.nuevoId();
    const dir = `${COLA}/${idSubida}`;
    await this.asegurarDirectorio(dir);

    for (let i = 0; i < datos.fotos.length; i++) {
      await Filesystem.rename({
        from: datos.fotos[i].archivo,
        to: `${dir}/${i}.jpg`,
        directory: Directory.Data,
        toDirectory: Directory.Data,
      });
    }

    const ahora = Date.now();
    const trabajo: TrabajoEvidencia = {
      version: 1,
      idSubida,
      folioEvento: datos.folioEvento,
      valor: datos.valor,
      tipo: 'RT',
      total: datos.fotos.length,
      protocolo: EVIDENCIA_PROTOCOLO,
      urlBase: URL,
      estado: 'PENDIENTE',
      intentos: 0,
      subidas: [],
      creado: ahora,
      actualizado: ahora,
      ultimoError: null,
    };
    await this.escribirTrabajo(trabajo);

    this.procesar();
    await this.refrescar();
    return trabajo;
  }

  async reintentarErrores(): Promise<number> {
    const trabajos = await this.listar();
    let n = 0;
    for (const t of trabajos) {
      if (t.estado === 'ERROR') {
        t.estado = 'PENDIENTE';
        t.intentos = 0;
        t.subidas = [];
        t.ultimoError = null;
        t.actualizado = Date.now();
        await this.escribirTrabajo(t);
        n++;
      }
    }
    if (n > 0) {
      this.procesar();
      await this.refrescar();
    }
    return n;
  }

  ultimoPorFolio(): { [folio: string]: TrabajoEvidencia } {
    const porFolio: { [folio: string]: TrabajoEvidencia } = {};
    for (const t of this.resumen.trabajos) {
      const previo = porFolio[t.folioEvento];
      if (!previo || previo.creado < t.creado) {
        porFolio[t.folioEvento] = t;
      }
    }
    return porFolio;
  }

  procesar(): void {
    if (Capacitor.isPluginAvailable('EvidenciasCola')) {
      EvidenciasCola.procesar().catch((e) =>
        console.error('No se pudo programar la cola de evidencias', e),
      );
      return;
    }
    this.procesarEnWeb();
  }

  async refrescar(): Promise<void> {
    if (this.refrescando) {
      return;
    }
    this.refrescando = true;
    try {
      let trabajos = await this.listar();
      trabajos = await this.limpiar(trabajos);
      await this.consultarEstadoServidor(trabajos);

      const resumen: ResumenEvidencias = {
        pendientes: trabajos.filter((t) =>
          ['PENDIENTE', 'SUBIENDO', 'ENVIADO'].includes(t.estado),
        ).length,
        errores: trabajos.filter((t) => t.estado === 'ERROR').length,
        trabajos,
      };
      this.zone.run(() => this.resumenSubject.next(resumen));

      if (
        Capacitor.isPluginAvailable('EvidenciasCola') &&
        trabajos.some((t) => t.estado === 'PENDIENTE')
      ) {
        this.procesar();
      }
    } catch (e) {
      console.error('No se pudo leer la cola de evidencias', e);
    } finally {
      this.refrescando = false;
    }
  }


  private async procesarEnWeb(): Promise<void> {
    if (this.procesandoWeb) {
      return;
    }
    this.procesandoWeb = true;
    try {
      const trabajos = await this.listar();
      for (const t of trabajos) {
        const abandonado =
          t.estado === 'SUBIENDO' &&
          Date.now() - t.actualizado > SUBIENDO_ABANDONADO_MS;
        if (t.estado === 'PENDIENTE' || abandonado) {
          const seguir = await this.subirEnWeb(t);
          if (!seguir) {
            break;
          }
        }
      }
    } finally {
      this.procesandoWeb = false;
      this.refrescar();
    }
  }

  private async subirEnWeb(t: TrabajoEvidencia): Promise<boolean> {
    t.estado = 'SUBIENDO';
    t.actualizado = Date.now();
    await this.escribirTrabajo(t);

    try {
      if (t.protocolo === 'v2') {
        await this.subirV2EnWeb(t);
        t.estado = 'ENVIADO';
      } else {
        await this.subirLegacyEnWeb(t);
        t.estado = 'COMPLETADO';
        await this.borrarFotos(t);
      }
      t.ultimoError = null;
      t.actualizado = Date.now();
      await this.escribirTrabajo(t);
      return true;
    } catch (error: any) {
      const sinRed = !error?.status;
      if (!sinRed) {
        t.intentos++;
      }
      t.estado = !sinRed && t.intentos >= MAX_INTENTOS ? 'ERROR' : 'PENDIENTE';
      t.ultimoError = this.describirError(error);
      t.actualizado = Date.now();
      await this.escribirTrabajo(t);
      return !sinRed;
    }
  }

  private async subirLegacyEnWeb(t: TrabajoEvidencia): Promise<void> {
    const fotos: string[] = [];
    for (let i = 0; i < t.total; i++) {
      const { data } = await Filesystem.readFile({
        path: `${COLA}/${t.idSubida}/${i}.jpg`,
        directory: Directory.Data,
      });
      fotos.push(typeof data === 'string' ? data : await this.blobABase64(data));
    }
    const body = {
      archivos: [t.folioEvento],
      fotos,
      valor: t.valor,
      tipo: t.tipo,
    };
    await this.aPromesa(
      this.http
        .post(`${t.urlBase}guardarFotos`, body, {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        })
        .pipe(timeout(SEGUNDOS_TIMEOUT_LEGACY * 1000), take(1)),
    );
  }

  private async subirV2EnWeb(t: TrabajoEvidencia): Promise<void> {
    for (let i = 0; i < t.total; i++) {
      if (t.subidas.includes(i)) {
        continue;
      }
      const { data } = await Filesystem.readFile({
        path: `${COLA}/${t.idSubida}/${i}.jpg`,
        directory: Directory.Data,
      });
      const blob =
        typeof data === 'string'
          ? await (await fetch(`data:image/jpeg;base64,${data}`)).blob()
          : data;
      const form = new FormData();
      form.append('idSubida', t.idSubida);
      form.append('indice', String(i));
      form.append('total', String(t.total));
      form.append('folioEvento', t.folioEvento);
      form.append('archivo', blob, `${i}.jpg`);
      await this.aPromesa(
        this.http
          .post(`${t.urlBase}evidencia/foto`, form)
          .pipe(timeout(SEGUNDOS_TIMEOUT_FOTO * 1000), take(1)),
      );
      t.subidas.push(i);
      t.actualizado = Date.now();
      await this.escribirTrabajo(t);
    }
    await this.aPromesa(
      this.http
        .post(`${t.urlBase}evidencia/confirmar`, {
          idSubida: t.idSubida,
          folioEvento: t.folioEvento,
          total: t.total,
          valor: t.valor,
          tipo: t.tipo,
        })
        .pipe(timeout(SEGUNDOS_TIMEOUT_FOTO * 1000), take(1)),
    );
  }


  private async consultarEstadoServidor(
    trabajos: TrabajoEvidencia[],
  ): Promise<void> {
    const enviados = trabajos.filter((t) => t.estado === 'ENVIADO');
    if (enviados.length === 0 || Date.now() - this.ultimaConsultaEstado < 30000) {
      return;
    }
    this.ultimaConsultaEstado = Date.now();

    for (const t of enviados) {
      try {
        const resp: any = await this.aPromesa(
          this.http
            .get(`${t.urlBase}evidencia/estado/${t.idSubida}`)
            .pipe(timeout(15000), take(1)),
        );
        const estado = resp?.current?.estado;
        if (estado === 'HECHO') {
          t.estado = 'COMPLETADO';
          t.ultimoError = null;
          await this.borrarFotos(t);
        } else if (estado === 'ERROR') {
          t.estado = 'ERROR';
          t.ultimoError = resp?.current?.mensaje ?? 'El servidor no pudo generar el PDF.';
        } else if (estado === 'DESCONOCIDO') {
          t.estado = 'PENDIENTE';
          t.subidas = [];
        } else {
          continue;
        }
        t.actualizado = Date.now();
        await this.escribirTrabajo(t);
      } catch (e) {
      }
    }
    if (enviados.some((t) => t.estado === 'PENDIENTE')) {
      this.procesar();
    }
  }


  private async listar(): Promise<TrabajoEvidencia[]> {
    let carpetas: string[] = [];
    try {
      const { files } = await Filesystem.readdir({
        path: COLA,
        directory: Directory.Data,
      });
      carpetas = files.filter((f) => f.type === 'directory').map((f) => f.name);
    } catch (e) {
      return [];
    }

    const trabajos: TrabajoEvidencia[] = [];
    for (const id of carpetas) {
      const t = await this.leerTrabajo(id);
      if (t) {
        trabajos.push(t);
      }
    }
    return trabajos.sort((a, b) => a.creado - b.creado);
  }

  private async leerTrabajo(idSubida: string): Promise<TrabajoEvidencia | null> {
    for (const nombre of [MANIFIESTO, `${MANIFIESTO}.tmp`]) {
      try {
        const { data } = await Filesystem.readFile({
          path: `${COLA}/${idSubida}/${nombre}`,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
        return JSON.parse(data as string) as TrabajoEvidencia;
      } catch (e) {
      }
    }
    return null;
  }

  private async escribirTrabajo(t: TrabajoEvidencia): Promise<void> {
    const dir = `${COLA}/${t.idSubida}`;
    await Filesystem.writeFile({
      path: `${dir}/${MANIFIESTO}.tmp`,
      data: JSON.stringify(t),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    await Filesystem.rename({
      from: `${dir}/${MANIFIESTO}.tmp`,
      to: `${dir}/${MANIFIESTO}`,
      directory: Directory.Data,
      toDirectory: Directory.Data,
    });
  }

  private async borrarFotos(t: TrabajoEvidencia): Promise<void> {
    for (let i = 0; i < t.total; i++) {
      await Filesystem.deleteFile({
        path: `${COLA}/${t.idSubida}/${i}.jpg`,
        directory: Directory.Data,
      }).catch(() => undefined);
    }
  }

  private async limpiar(
    trabajos: TrabajoEvidencia[],
  ): Promise<TrabajoEvidencia[]> {
    const vigentes: TrabajoEvidencia[] = [];
    for (const t of trabajos) {
      const viejo =
        t.estado === 'COMPLETADO' &&
        Date.now() - t.actualizado > RETENCION_COMPLETADOS_MS;
      if (viejo) {
        await Filesystem.rmdir({
          path: `${COLA}/${t.idSubida}`,
          directory: Directory.Data,
          recursive: true,
        }).catch(() => undefined);
      } else {
        vigentes.push(t);
      }
    }
    return vigentes;
  }

  private async asegurarDirectorio(path: string): Promise<void> {
    try {
      await Filesystem.mkdir({
        path,
        directory: Directory.Data,
        recursive: true,
      });
    } catch (e) {
    }
  }


  private nuevoId(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10, 16).join(''),
    ].join('-');
  }

  private blobABase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve((lector.result as string).split(',')[1]);
      lector.onerror = () => reject(lector.error);
      lector.readAsDataURL(blob);
    });
  }

  private aPromesa<T>(obs: Observable<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      obs.subscribe({ next: resolve, error: reject });
    });
  }

  private describirError(error: any): string {
    if (error?.name === 'TimeoutError') {
      return 'El servidor no respondió a tiempo.';
    }
    if (error?.status) {
      return `El servidor respondió ${error.status}.`;
    }
    return 'Sin conexión con el servidor.';
  }
}
