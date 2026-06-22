import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { COLORSMAPS } from '../../../../utils/MapTheme';
import { Subscription } from 'rxjs';
import { Recorrido } from '../../../../classes/Recorrido';
import { StorageProvider } from '../../../../providers/storage/storage';
import { LoadingController, ModalController, NavController } from '@ionic/angular';
import { PendientesProvider } from '../../../../providers/pendientes/pendientes';
import { ComunService } from '../../../../providers/comun/comun';
import { Geolocation, Position } from '@capacitor/geolocation';
import { ActivatedRoute } from '@angular/router';
import { MisRecorridosPage } from './mis-recorridos/mis-recorridos';
import { AppLauncher } from '@capacitor/app-launcher';
import { Dialog } from '@capacitor/dialog';

declare var google: any;

// Querido colega programador
//
// Cuando escribí este código, sólo Dios y yo
// sabíamos cómo funcionaba.
// Ahora, ¡sólo Dios lo sabe!
//
// Así que si está tratando de 'optimizarlo'
// y fracasa (seguramente), por favor,
// incremente el contador a continuación
// como una advertencia para su siguiente colega:
//
// total_horas_perdidas_aqui = 32
// Pd. Suerte colega XD !
// Pd2. Ya funciona!!!
//
//
//18/06/2026
//Un mensaje del pasado al futuro
//soy otro colaborador me dicen Mike
//te deseo suerte colega.
//
//horas peridas: 28
//Pd2. Mi version ya funciona!!

@Component({
  selector: 'page-mapa',
  templateUrl: 'mapa.html',
  styleUrls: ['mapa.scss'],
})
export class MapaPage {
  COLORSMAPS = COLORSMAPS;
  openbottom = false;
  openbottom2 = false;
  openbottom3 = false;
  openbottom4 = false;
  openbottom5 = false;
  isTracking = false;
  Mylat: any;

  Mylong: any;
  recorrido: any[] = [];

  mapdiv: any;
  marker: any;
  myVelocity = 0;
  InLowSpeed = false;
  registros = [];
  // KM minimo
  Rangomenor = 5;
  // KM Maximo
  RangoMayor = 11;
  watch: Subscription | null = null;
  fechaIniSlow: Date | null = null;
  // Tiempo Maximo al que puede ir por debajo del rango-> Millisegundos -> a Minutos...
  TiempoMax = 240000;
  slowly = false;
  recorridoStorage: Recorrido | null = null;
  recorridosLocales = [];

  coordenadas: any[] = [];
  pendientes: any[] = [];
  items: any[] = [];
  nombreDestino: string = '';
  direccion: string = '';
  @ViewChild('map') mapElement!: ElementRef;
  alerta: boolean = true;

  coordenadasT: any[] = [];

  seleccionada: number = 0;

  latitudActual: any = null;
  longitudActual: any = null;
  altitudActual: any = null;

  txtDistancia: String = '';

  distancia: any = {km: '0', tiempo: 'Calculando...'};

  _proquifa: any[] = [19.2856554, -99.1595433];
  isProquifa: boolean = true;
  //_ryndem: any[] = [18.933217, -99.193012];

  serviceDistance = new google.maps.DistanceMatrixService();
  watchId: string | null = null; // Para guardar el ID del watcher
  pendientesSubscription: Subscription | null = null;

  constructor(
    private _storage: StorageProvider,
    public modalCtrl: ModalController,
    public geolocation: Geolocation,
    public zone: NgZone,
    public _pendientes: PendientesProvider,
    private _login: ComunService,
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
  ) {
    this.activatedRoute.queryParams.subscribe(async (params: any) => {
      console.log('llega->', JSON.parse(params.items));
      this.coordenadas = JSON.parse(params.data);
      this.nombreDestino = params.nombre;
      this.direccion = params.direccion;
      this.items = JSON.parse(params.items);

      this.coordenadasT = this.coordenadas[0]; //Esta variable trae las cordenadas seleccionadas

      this._storage.getRecorridos().then((recorridos: any) => {
        console.log('Mensaje en consola Obtuvo los recorridos', recorridos);
        this.recorridosLocales = recorridos;
      });
    });
  }

  ionViewWillEnter() {
    this.activatedRoute.queryParams.subscribe(async (params: any) => {
      this.openbottom = false;
      this.openbottom2 = false;
      this.openbottom3 = false;
      this.openbottom4 = false;
      this.openbottom5 = false;
      this.isTracking = false;
      console.log('Mensaje en consola Entró a ionViewWillEnter');
      this.watchId = await Geolocation.watchPosition(
        {},
        (position: Position | null, err?: any) => {
          if (position) {
            this.longitudActual = position.coords.longitude;
            this.latitudActual = position.coords.latitude;
            this.altitudActual = position.coords.altitude;
          }
          if (err) {
            console.error('Mensaje en consola Error al observar posición:', err);
          }
        },
      );
    });
  }

  async cargarMapa() {
    console.log('Mensaje en consola Entró a cargarMapa');
    this.activatedRoute.queryParams.subscribe(async (params: any) => {
      this.pendientes = JSON.parse(params.pendientes);
      console.log('Mensaje en consola Pendientes recibidos:', this.pendientes);
      console.log('Mensaje en consola Pendientes recibidos:', this.pendientes);

      // Círculo de "cargando" mientras se obtiene el GPS, se pinta el mapa y la ruta.
      const loading = await this.loadingCtrl.create({
        message: 'Cargando mapa...',
        spinner: 'crescent',
      });
      await loading.present();

      try {
        // Obtener la ubicación actual (con timeout para no dejar el mapa esperando
        // indefinidamente donde el GPS es débil).
        try {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          });
          this.Mylat = position.coords.latitude;
          this.Mylong = position.coords.longitude;
        } catch (error) {
          // Si no hay GPS o permiso de ubicación (p. ej. en el navegador de
          // escritorio o sin señal), centramos el mapa en Proquifa para que
          // igual se dibuje en lugar de quedarse en blanco.
          console.error(
            'Mensaje en consola No se pudo obtener la ubicación, usando ubicación por defecto:',
            error,
          );
          this.Mylat = this._proquifa[0];
          this.Mylong = this._proquifa[1];
        }

        console.log('Latitud:', this.Mylat);
        console.log('Longitud:', this.Mylong);

        // Llamar a los métodos para cargar el mapa y crear la ruta.
        // No se asigna el resultado a this.marker: loadMap ya creó el marcador
        // "Mi Ubicación" que usa updatePosition; crearRuta solo dibuja la ruta.
        this.mapdiv = this.loadMap();
        await this.crearRuta();
      } finally {
        // Se cierra el círculo de carga pase lo que pase (éxito o error).
        await loading.dismiss();
      }

      // Aviso TEMPRANO: si el destino no tiene coordenada válida en la BD (y no es
      // una captura intencional), se avisa apenas carga el mapa, no hasta finalizar.
      if (this.destinoSinUbicacion()) {
        await this.avisarDestinoSinUbicacion();
      }
    });
  }

  /**
   * @method destinoSinUbicacion
   * @description true si el destino NO tiene coordenada válida en la BD (null/0,0/
   * fuera de rango) y NO es una captura intencional (flag actualizar).
   * **/
  destinoSinUbicacion(): boolean {
    const item = this.items && this.items.length ? this.items[0] : null;
    if (!item) {
      return false;
    }
    if (item.actualizar) {
      return false; // captura intencional; no es un dato faltante
    }
    return !this.esCoordenadaValida(item.latitud, item.longitud);
  }

  /**
   * @method avisarDestinoSinUbicacion
   * @description Muestra el aviso de que el destino no tiene ubicación registrada.
   * **/
  async avisarDestinoSinUbicacion() {
    await Dialog.alert({
      title: 'Destino sin ubicación registrada',
      message:
        'Este destino no tiene latitud/longitud registradas correctamente en ' +
        'el sistema, por lo que no se puede validar tu cercanía ni finalizar el ' +
        'recorrido. Repórtalo con Soporte a la Produccion, para que actualicen' +
        'la información en la base de datos.',
    });
  }

  ionViewDidEnter() {
    console.log('Mensaje en consola Entró a ionViewDidEnter');
    // En Ionic 6 el evento ionViewDidLoad (de Ionic 3) ya no se dispara,
    // por eso el mapa nunca se inicializaba al entrar al pendiente.
    // Lo cargamos aquí, que sí es un evento válido en Ionic 6.
    this.cargarMapa();
    this.validarUbicacionProquifa();
    if (this.isProquifa) {
      //this.dist_time(this._proquifa, [this.items[0].latitud, this.items[0].longitud])
      this.serviceDistance.getDistanceMatrix(
        {
          origins: [
            new google.maps.LatLng(this._proquifa[0], this._proquifa[1]),
          ],
          destinations: [
            new google.maps.LatLng(
              this.items[0].latitud,
              this.items[0].longitud,
            ),
          ],
          travelMode: 'DRIVING',
        },
        this.dist_time.bind(this),
      );
    } else {
      this.serviceDistance.getDistanceMatrix(
        {
          origins: [
            new google.maps.LatLng(this.latitudActual, this.longitudActual),
          ],
          destinations: [
            new google.maps.LatLng(
              this.items[0].latitud,
              this.items[0].longitud,
            ),
          ],
          travelMode: 'DRIVING',
        },
        this.dist_time.bind(this),
      );
    }
  }

  ionViewWillLeave() {
    console.log('Mensaje en consola Entró a ionViewWillLeave');
    if (this.watchId) {
      Geolocation.clearWatch({id: this.watchId});
    }
    this.pendientesSubscription?.unsubscribe();
  }

  dist_time(response: any, status: any) {
    console.log('Respuesta distancia', response, status);
    let km = response.rows[0].elements[0].distance['text'].split(' ');
    let min = response.rows[0].elements[0].duration['text'];
    min = min.replace('', '');
    min = min.replace('hour', 'hr');
    min = min.replace('mins', 'min');
    this.distancia = {km: km[0], tiempo: min};
    console.log('Distancia', this.distancia);
  }

  CambiarUbicacion() {
    this.openbottom = true;
  }

  esconder() {
    this.openbottom = false;
  }

  esconder2() {
    this.openbottom2 = false;
  }

  // Se Inicializa todo para comenzar el recorrido
  async IniciarRecorrido() {
    let fechaInicio = new Date();
    let month;
    let day;
    let hora =
      fechaInicio.getHours() +
      ':' +
      fechaInicio.getMinutes() +
      ':' +
      fechaInicio.getSeconds();

    if (fechaInicio.getMonth() + 1 < 10) {
      month = '0' + (fechaInicio.getMonth() + 1);
    } else {
      month = fechaInicio.getMonth() + 1;
    }
    if (fechaInicio.getDate() < 10) {
      day = '0' + fechaInicio.getDate();
    } else {
      day = fechaInicio.getDate();
    }

    let recorrido: any = {
      latitud: this.Mylat,
      longitud: this.Mylong,
      idRuta: this.items[0].idRuta,
      idCliente: this.items[0].idCliente,
      direccion: this.items[0].idHorario,
      tipo: 'I',
    };
    console.log('recorrido!!', recorrido);
    this.pendientesSubscription = this._pendientes
      .insertarRecorrido(recorrido)
      .subscribe({
        next: (data) => {
          console.log(data);
        },
        error: (error) => {
          console.log(error);
        },
      });

    let fechai =
      fechaInicio.getFullYear() + '-' + month + '-' + day + ':' + hora;
    this.recorridoStorage = new Recorrido();
    this.recorridoStorage.fecha = fechai;
    this.recorridoStorage.f_inico = fechai;
    this.recorridoStorage.inicio = {lat: this.Mylat, lng: this.Mylong};
    this.isTracking = true;
    this.mapdiv = this.loadMap();
    this.marker = this.crearRuta();

    let unaruta: any[] = [];
    this.watchId = await Geolocation.watchPosition(
      {enableHighAccuracy: true, timeout: 2000},
      (data: Position | null, err?: any) => {
        if (err) {
          console.error('Mensaje en consola Error en watchPosition:', err);
          return;
        }

        if (data && data.coords) {
          this.Mylat = data.coords.latitude;
          this.Mylong = data.coords.longitude;
          let newcoords = {
            lat: data.coords.latitude,
            lng: data.coords.longitude,
            velocity: data.coords.speed != null ? data.coords.speed * 3.6 : 0,
          };

          if (this.isTracking) {
            if (data.coords.speed != null) {
              let speedKMH = data.coords.speed * 3.6;
              if (speedKMH > 1) {
                this.recorrido.push(newcoords);
                this.updatePosition();
                this.drawRoute();
                this.myVelocity = data.coords.speed * 3.6;
              }
            }

            let speedKMH =
              data.coords.speed != null ? data.coords.speed * 3.6 : 0;
            if (speedKMH >= 0 && speedKMH < 12) {
              if (this.slowly == false) {
                this.slowly = true;
                this.fechaIniSlow = new Date();
              } else {
                let ahora = new Date();
                if (ahora.getTime() - this.fechaIniSlow!.getTime() > 240000) {
                  let obj = {
                    lat: data.coords.latitude,
                    lng: data.coords.longitude,
                    speed: speedKMH,
                  };
                  unaruta.push(obj);
                }
              }
            } else {
              if (unaruta.length > 0) {
                this.makeRoute(unaruta);
                // @ts-ignore
                this.registros.push(unaruta);
                unaruta = [];
                this.slowly = false;
                this.fechaIniSlow = null;
              }
            }
            console.log('Recorrido', JSON.stringify(this.recorrido));
          }
        }
      },
    );
    console.log('Mensaje en consola Se inicia un  recorrido');

    // @ts-ignore
    const coordinates = `${this.coordenadasT['lat']},${this.coordenadasT['lng']}`;
    const label = encodeURIComponent('Ubicación seleccionada');

    try {
      // URL estándar para el intent implícito de mapas
      const url = `geo:${coordinates}?q=${coordinates}(${label})`;

      // Lanza el diálogo nativo
      const result = await AppLauncher.openUrl({url});

      if (result.completed) {
        console.log('Mensaje en consola Aplicación abierta correctamente');
      } else {
        console.log(
          'Mensaje en consola No se seleccionó ninguna aplicación o falló',
        );
      }
    } catch (error) {
      console.error(
        'Mensaje en consola Error al abrir el diálogo de aplicaciones:',
        error,
      );

      // Fallback: abrir Google Maps en el navegador
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${coordinates}`,
        '_blank',
      );
    }
  }

  // Se Cambia el punto final de una ruta con una alerta
  cambiarRuta(i: number) {
    this.openbottom = false;
    this.openbottom2 = true;
    this.seleccionada = i;
    this.isTracking = false;
  }

  //Pendiente *************************
  cambio() {
    this.coordenadasT = this.pendientes[this.seleccionada].coordenada;

    this.nombreDestino = this.pendientes[this.seleccionada].empresa;
    this.direccion = this.pendientes[this.seleccionada].ruta;
    setTimeout(() => {
      this.crearRuta();
    }, 1000);
  }

  // Se Detiene el recorrido con una alerta
  detenerRecorrido() {
    this.openbottom3 = true;
    let fechaFinal = new Date();
    let monthF;
    let dayF;
    let horaF;

    if (fechaFinal.getMonth() + 1 < 10) {
      monthF = '0' + (fechaFinal.getMonth() + 1);
    } else {
      monthF = fechaFinal.getMonth() + 1;
    }
    if (fechaFinal.getDate() < 10) {
      dayF = '0' + fechaFinal.getDate();
    } else {
      dayF = fechaFinal.getDate();
    }
    let fechaf = fechaFinal.getFullYear() + '-' + monthF + '-' + dayF;

    let recorrido: any = {
      latitud: this.Mylat,
      longitud: this.Mylong,
      idRuta: this.items[0].idRuta,
      idCliente: this.items[0].idCliente,
      direccion: this.items[0].idHorario,
      tipo: 'F',
    };
    console.log('recorrido!!', recorrido);
    this._pendientes.insertarRecorrido(recorrido).subscribe(
      (data) => {
        console.log(data);
      },
      (error) => {
        console.log(error);
      },
    );

    // console.log('**************************');
    console.log(
      'Esta es la ruta que se trazó a lo largo del viaje.',
      this.recorrido,
    );
    this.recorridoStorage!.f_fin = fechaf;
    this.recorridoStorage!.fin = {lat: this.Mylat, lng: this.Mylong};
    this.recorridoStorage!.matrizInicidencias = this.registros;
    this.recorridoStorage!.matrizRuta = this.recorrido;
    // @ts-ignore
    this.recorridosLocales.push(this.recorridoStorage);
    this._storage
      .setRecorridos(this.recorridosLocales)
      .then(() => {
        console.log('Aqui ya se guardo el recorrido');
        this._storage.getRecorridos().then((recorridos: any) => {
          this.recorridosLocales = recorridos;
        });
      })
      .catch(() => {
        console.log('Nada que hacer porque hay un error');
      });

    this.isTracking = false;

    try {
      this.watch?.unsubscribe();
      console.log('Se detuvo el observable');
    } catch (e) {
      console.log(JSON.stringify(e));
    }
  }

  aceptar() {
    this.openbottom4 = true;
    this.openbottom3 = false;
  }

  /**
   * @method asegurarUbicacionActual
   * @description Espera (mostrando un spinner) hasta que el GPS del mensajero
   * esté disponible. Primero intenta un fix activo con getCurrentPosition y, como
   * respaldo, espera a que el watcher (watchPosition) llene la posición.
   * @returns true si se obtuvo la ubicación; false si se agotó el tiempo.
   * **/
  async asegurarUbicacionActual(maxEsperaMs: number = 15000): Promise<boolean> {
    // Si ya tenemos ubicación, no hay nada que esperar.
    if (this.latitudActual != null && this.longitudActual != null) {
      return true;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Obteniendo tu ubicación, espera...',
      spinner: 'crescent',
    });
    await loading.present();

    // 1) Intento activo de obtener un fix de inmediato.
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: maxEsperaMs,
        maximumAge: 0,
      });
      this.latitudActual = pos.coords.latitude;
      this.longitudActual = pos.coords.longitude;
      this.altitudActual = pos.coords.altitude;
    } catch (e) {
      console.error(
        'Mensaje en consola No se obtuvo posición activa; se espera al watcher',
        e,
      );
    }

    // 2) Respaldo: si aún no hay posición, esperar a que el watcher la llene.
    const inicio = Date.now();
    while (
      (this.latitudActual == null || this.longitudActual == null) &&
      Date.now() - inicio < maxEsperaMs
    ) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await loading.dismiss();
    return this.latitudActual != null && this.longitudActual != null;
  }

  async validarUbicacion() {
    // El GPS del mensajero (latitudActual/longitudActual) lo llena watchPosition
    // de forma asíncrona. Si el mensajero valida antes de que llegue el primer
    // fix, esas coordenadas están en null y la distancia sale mal (marca "lejos").
    // Por eso esperamos a tener la ubicación antes de validar.
    // Excepción: idFuncion == 2 no usa GPS real (se fuerza a 1 más abajo).
    if (this._login.Usuario.idFuncion != 2) {
      const tieneUbicacion = await this.asegurarUbicacionActual();
      if (!tieneUbicacion) {
        await Dialog.alert({
          title: 'Ubicación no disponible',
          message:
            'No se pudo obtener tu ubicación GPS. Verifica que el GPS esté ' +
            'encendido y que la app tenga permiso de ubicación, e inténtalo de nuevo.',
        });
        return;
      }
    }

    let latitud: any = this.items[0].latitud;
    let longitud: any = this.items[0].longitud;
    console.log('this.items[0].latitud', this.items[0].latitud);
    console.log('this.items[0].longitud', this.items[0].longitud);

    let latitudP: any = this._proquifa[0];
    let longitudP: any = this._proquifa[1];

    let distancia: any = 0;
    let distanciaP: any = 0;

    if (latitud == null && longitud == null) {
      latitud = 0;
      longitud = 0;
    }

    // Distancia del mensajero a Proquifa (misma función que usa el log).
    distanciaP = this.calcularDistancia(
      this.latitudActual,
      this.longitudActual,
      latitudP,
      longitudP,
    );
    if (distanciaP == null) {
      distanciaP = 10000;
    }

    console.log('item', this.items);

    if (this._login.Usuario.idFuncion == 2) {
      this.latitudActual = 1;
      latitud = 1;
      this.longitudActual = 1;
      longitud = 1;
    }
    console.log(
      'Mensaje en consola this.items[0].actualizar',
      this.items[0].actualizar,
    );
    console.log('Mensaje en consola latitud', latitud);
    console.log('Mensaje en consola longitud', longitud);
    console.log('Mensaje en consola distanciaP', distanciaP);
    // ¿El destino trae una coordenada válida en la BD? (no null, no 0,0, en rango)
    const destinoValido = this.esCoordenadaValida(latitud, longitud);

    if (this.items[0].actualizar) {
      // Captura INTENCIONAL de la ubicación del cliente (flag Actualizar en BD,
      // p. ej. primera visita). Aquí sí se guarda el GPS del mensajero como
      // coordenada del destino y se permite continuar.
      console.log('entro guardar coordenadas');
      for (let item of this.items) {
        item.latitud = this.latitudActual;
        item.longitud = this.longitudActual;
      }
      this._pendientes.validarCoordenadasGPS(this.items).subscribe(
        (data) => {
          const params = {
            pendiente: JSON.stringify(this.items),
            nombre: this.nombreDestino,
          };
          this.navCtrl.navigateForward('/tabs/pendientes/pendientes-detalle', {
            queryParams: params,
          });
        },
        (error) => {
          console.error(error);
        },
      );
    } else if (!destinoValido) {
      // El destino NO tiene latitud/longitud válidas en la BD (null / 0,0) y NO es
      // una captura intencional. No se puede validar cercanía ni finalizar el
      // recorrido: se bloquea y se avisa para corregir la ubicación en la BD.
      console.error(
        'Mensaje en consola Destino sin coordenada válida en BD -> no se permite finalizar:',
        this.items[0].latitud,
        this.items[0].longitud,
      );
      await this.avisarDestinoSinUbicacion();
      return;
    } else {
      if (latitud != 0 && longitud != 0) {
        // Distancia del mensajero al destino (misma función que usa el log).
        distancia = this.calcularDistancia(
          this.latitudActual,
          this.longitudActual,
          latitud,
          longitud,
        );
        if (distancia == null) {
          distancia = 10000;
        }
      } else {
        distancia = 10000;
      }
      //DOCS: ditancia = La distancia entre mi ubicación actual y el destino
      //DOCS: distanciaP = La distancia entre mi ubicación actual y Proquifa
      //DOCS: Esta validando que este a 1km del destino o de proquifa
      console.log('ditancia del destino ->', distancia < 1000)
      console.log('ditancia de proquifa ->', distanciaP < 1000)
      if (distancia < 1000 || distanciaP < 1000) {
        console.log('Mensaje en consola entró a navegar a pendientes-detalle');
        const params = {
          pendiente: JSON.stringify(this.items),
          nombre: this.nombreDestino,
        };
        this.navCtrl.navigateForward('/tabs/pendientes/pendientes-detalle', {
          queryParams: params,
        });
      } else {
        this.openbottom4 = false;
        this.openbottom5 = true;
        if (distancia > 1000) {
          this.txtDistancia = Math.round((distancia / 1000) * 100) / 100 + 'km';
        } else {
          this.txtDistancia = distancia + 'm';
        }
      }
    }
    //
  }

  validarUbicacionProquifa() {
    const distancia = this.calcularDistancia(
      this.latitudActual,
      this.longitudActual,
      this._proquifa[0],
      this._proquifa[1],
    );
    this.isProquifa = distancia != null && distancia < 1000;
  }

  /**
   * @method calcularDistancia
   * @description Calcula la distancia en metros entre dos coordenadas usando la
   * MISMA fórmula (ley esférica de cosenos) que validarUbicacion(), para que el
   * log refleje exactamente lo que evalúa la validación.
   * Devuelve null si algún dato no es un número válido.
   * **/
  calcularDistancia(
    lat1: any,
    lon1: any,
    lat2: any,
    lon2: any,
  ): number | null {
    // Acepta números o cadenas (incluso con coma decimal, como puede venir de
    // la BD). Devuelve null si algún dato no es numérico.
    const toNum = (v: any): number | null => {
      if (v === null || v === undefined || v === '') {
        return null;
      }
      const n = parseFloat(String(v).replace(',', '.'));
      return isNaN(n) ? null : n;
    };
    const a1 = toNum(lat1);
    const o1 = toNum(lon1);
    const a2 = toNum(lat2);
    const o2 = toNum(lon2);
    if (a1 == null || o1 == null || a2 == null || o2 == null) {
      return null;
    }

    // Fórmula de Haversine: estable para distancias cortas. La ley esférica de
    // cosenos que se usaba antes devolvía NaN cuando los dos puntos casi
    // coincidían (por redondeo, acos recibía un valor > 1), y por eso la app
    // marcaba "estás lejos" aun estando el mensajero parado en la ubicación.
    const R = 6371000; // radio de la Tierra en metros
    const rad = Math.PI / 180;
    const dLat = (a2 - a1) * rad;
    const dLon = (o2 - o1) * rad;
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a1 * rad) *
        Math.cos(a2 * rad) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const d = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
    return isNaN(d) ? null : d;
  }

  /**
   * @method generarLog
   * @description Vuelca un diagnóstico de la validación de ubicación: posición del
   * mensajero, posición del destino (tal como llega de la BD), Proquifa, distancias
   * calculadas, qué condición falla y los IDs para reproducir la consulta en la BD.
   * Lo imprime en consola (visible con `adb logcat | findstr Console`) y lo muestra
   * en pantalla para poder leerlo/capturarlo en el dispositivo.
   * **/
  async generarLog() {
    const item = this.items && this.items.length ? this.items[0] : null;

    const latDest = item ? item.latitud : null;
    const lonDest = item ? item.longitud : null;

    // Convierte a número soportando coma decimal; null si no es numérico.
    const toNum = (v: any): number | null => {
      if (v === null || v === undefined || v === '') {
        return null;
      }
      const n = parseFloat(String(v).replace(',', '.'));
      return isNaN(n) ? null : n;
    };

    const latD = toNum(latDest);
    const lonD = toNum(lonDest);
    const latA = toNum(this.latitudActual);
    const lonA = toNum(this.longitudActual);

    const distanciaDestino =
      latD == null || lonD == null || (latD === 0 && lonD === 0)
        ? null
        : this.calcularDistancia(latA, lonA, latD, lonD);
    const distanciaProquifa = this.calcularDistancia(
      latA,
      lonA,
      this._proquifa[0],
      this._proquifa[1],
    );

    // Detección de datos faltantes/incorrectos del destino (lo que viene de la BD).
    // Marcamos con banderas si el problema es de DATOS (BD) o del DISPOSITIVO (GPS)
    // para poder dar un veredicto claro del origen más abajo.
    const problemas: string[] = [];
    let problemaBD = false;
    let problemaGPS = false;
    if (latDest === null || latDest === undefined || latDest === '') {
      problemas.push('latitud destino NULA/vacía (revisar BD)');
      problemaBD = true;
    }
    if (lonDest === null || lonDest === undefined || lonDest === '') {
      problemas.push('longitud destino NULA/vacía (revisar BD)');
      problemaBD = true;
    }
    if (latD === 0 && lonD === 0) {
      problemas.push('coordenada destino en 0,0 (no capturada)');
      problemaBD = true;
    }
    if (latD != null && latD !== 0 && (latD < 14 || latD > 33)) {
      problemas.push('latitud destino fuera de México');
      problemaBD = true;
    }
    if (lonD != null && lonD !== 0 && (lonD < -118 || lonD > -86)) {
      problemas.push('longitud destino fuera de México');
      problemaBD = true;
    }
    if (latD != null && lonD != null && Math.abs(latD) > Math.abs(lonD)) {
      problemas.push('lat/long posiblemente INVERTIDAS');
      problemaBD = true;
    }
    if (latA == null || lonA == null) {
      problemas.push('GPS del mensajero no disponible');
      problemaGPS = true;
    }

    const cumpleDestino = distanciaDestino != null && distanciaDestino < 1000;
    const cumpleProquifa = distanciaProquifa != null && distanciaProquifa < 1000;

    // Veredicto del ORIGEN del problema: ¿viene de la BD, del dispositivo (GPS),
    // o simplemente el mensajero está lejos de verdad (datos correctos)?
    let origen: string;
    if (problemaBD) {
      origen = 'DATOS DE LA BD — la coordenada del destino está mal o ausente';
    } else if (problemaGPS) {
      origen = 'DISPOSITIVO — no se obtuvo el GPS del mensajero';
    } else if (!cumpleDestino && !cumpleProquifa) {
      origen =
        'LEJANÍA REAL — datos OK; el mensajero está a más de 1 km del destino y de Proquifa';
    } else {
      origen = 'SIN PROBLEMA — la validación debería PASAR';
    }

    const diagnostico = {
      fecha: new Date().toISOString(),
      origen_probable: origen,
      mensajero: {
        latitud: this.latitudActual,
        longitud: this.longitudActual,
      },
      destino: {
        empresa: this.nombreDestino,
        direccion: this.direccion,
        latitud_raw: latDest,
        longitud_raw: lonDest,
        tipo_latitud: typeof latDest,
        tipo_longitud: typeof lonDest,
      },
      proquifa: { latitud: this._proquifa[0], longitud: this._proquifa[1] },
      distancias_metros: {
        al_destino: distanciaDestino,
        a_proquifa: distanciaProquifa,
      },
      condicion: {
        regla: 'PASA si (distanciaDestino < 1000) O (distanciaProquifa < 1000)',
        cumple_destino: cumpleDestino,
        cumple_proquifa: cumpleProquifa,
        resultado: cumpleDestino || cumpleProquifa ? 'PASA' : 'NO PASA',
      },
      datos_para_consulta_BD: {
        idCliente: item ? item.idCliente : null,
        idRuta: item ? item.idRuta : null,
        idHorario_FK01_Direccion: item ? item.idHorario : null,
        evento: item ? item.evento : null,
        folioEvento: item ? item.folioEvento : null,
      },
      problemas_detectados: problemas.length
        ? problemas
        : ['ninguno en los datos; revisar GPS/cobertura del dispositivo'],
      item_completo: item,
    };

    console.log('=== LOG DIAGNÓSTICO UBICACIÓN ===');
    console.log(JSON.stringify(diagnostico, null, 2));

    const fmt = (d: number | null) =>
      d == null ? 'N/D' : Math.round(d) + ' m';

    const resumen =
      `>>> ORIGEN PROBABLE: ${origen}\n\n` +
      `Mensajero (GPS): ${this.latitudActual}, ${this.longitudActual}\n` +
      `Destino (BD): ${latDest}, ${lonDest}\n` +
      `Proquifa: ${this._proquifa[0]}, ${this._proquifa[1]}\n\n` +
      `Dist. al destino: ${fmt(distanciaDestino)}\n` +
      `Dist. a Proquifa: ${fmt(distanciaProquifa)}\n\n` +
      `Regla: PASA si destino<1000m O Proquifa<1000m\n` +
      `Cumple destino: ${cumpleDestino} | Cumple Proquifa: ${cumpleProquifa}\n` +
      `Resultado: ${diagnostico.condicion.resultado}\n\n` +
      `idCliente: ${diagnostico.datos_para_consulta_BD.idCliente}\n` +
      `idRuta: ${diagnostico.datos_para_consulta_BD.idRuta}\n` +
      `idHorario (FK01_Direccion): ${diagnostico.datos_para_consulta_BD.idHorario_FK01_Direccion}\n` +
      `evento: ${diagnostico.datos_para_consulta_BD.evento}\n\n` +
      `Problemas: ${
        problemas.length ? problemas.join('; ') : 'ninguno en datos'
      }`;

    await Dialog.alert({ title: 'Log de diagnóstico', message: resumen });
  }

  loadMap() {
    const latLng = new google.maps.LatLng(this.Mylat, this.Mylong);

    const mapOptions = {
      center: latLng,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };

    const map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

    // Coloca un marcador en la ubicación actual
    this.marker = new google.maps.Marker({
      position: latLng,
      map: map,
      title: 'Mi Ubicación',
    });

    return map;
  }

  // Se pinta el mapa para los recorridos que sustituye al de iniciar ruta
  loadMapRoutes(center: any) {
    var map = new google.maps.Map(this.mapElement.nativeElement, {
      zoom: 13,
      center: center,
      disableDefaultUI: false,
      styles: this.COLORSMAPS,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
    });
    return map;
  }

  /**
   * @method esCoordenadaValida
   * @description Valida que un par lat/lng sea utilizable para trazar ruta:
   * no nulo, no NaN, no (0,0) y dentro del rango mundial. Soporta coma decimal.
   * **/
  esCoordenadaValida(lat: any, lng: any): boolean {
    const a = typeof lat === 'string' ? parseFloat(lat.replace(',', '.')) : lat;
    const o = typeof lng === 'string' ? parseFloat(lng.replace(',', '.')) : lng;
    if (a == null || o == null || isNaN(a) || isNaN(o)) {
      return false;
    }
    if (a === 0 && o === 0) {
      return false; // (0,0) cae en el océano Atlántico -> ZERO_RESULTS
    }
    if (a < -90 || a > 90 || o < -180 || o > 180) {
      return false;
    }
    return true;
  }

  /**
   * @method esperarOrigenValido
   * @description Devuelve una posición válida del mensajero (Mylat/Mylong o, como
   * respaldo, la del watcher latitudActual/longitudActual), reintentando hasta que
   * el GPS dé un fix. Así la ruta se dibuja cuando llega la ubicación, en vez de
   * cancelarse para siempre si el GPS aún no estaba listo.
   * @returns {lat, lng} válido o null si se agotó el tiempo.
   * **/
  async esperarOrigenValido(
    maxEsperaMs: number = 12000,
  ): Promise<{ lat: number; lng: number } | null> {
    const inicio = Date.now();
    while (Date.now() - inicio < maxEsperaMs) {
      if (this.esCoordenadaValida(this.Mylat, this.Mylong)) {
        return { lat: this.Mylat, lng: this.Mylong };
      }
      if (this.esCoordenadaValida(this.latitudActual, this.longitudActual)) {
        return { lat: this.latitudActual, lng: this.longitudActual };
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return null;
  }

  // Se Crean los primeros markadores
  async crearRuta() {
    // this.isTracking = true;;
    console.log('--------->', this.coordenadasT);

    let final: any = this.coordenadasT;
    const destLat = final ? final.lat : null;
    const destLng = final ? final.lng : null;

    // El destino viene de la BD; si no es válido no hay nada que rutear.
    if (!this.esCoordenadaValida(destLat, destLng)) {
      console.error(
        'Mensaje en consola No se dibuja ruta: coordenada del destino inválida (revisar BD):',
        destLat,
        destLng,
      );
      return;
    }

    // El GPS del mensajero puede tardar en dar el primer fix (o llegar 0,0).
    // Esperamos a tener un origen válido en vez de cancelar la ruta.
    const origen = await this.esperarOrigenValido();
    if (!origen) {
      console.error(
        'Mensaje en consola No se dibuja ruta: no se obtuvo posición válida del mensajero (GPS sin fix)',
      );
      return;
    }
    const origenLat = origen.lat;
    const origenLng = origen.lng;

    console.log(
      'Mensaje en consola crearRuta -> origen:',
      origenLat,
      origenLng,
      '| destino:',
      destLat,
      destLng,
    );

    let inicio = new google.maps.LatLng(origenLat, origenLng);

    let directionsService = new google.maps.DirectionsService();
    let directionsDisplay = new google.maps.DirectionsRenderer({
      map: this.mapdiv,
    });

    let iconoFin = './assets/imgs/UBICACION.svg';
    let iconoInicio = './assets/imgs/RADIO_ACTIVO.svg';

    var startMarker = new google.maps.Marker({
      position: inicio,
      map: this.mapdiv,
      icon: iconoInicio,
    });
    var stopMarker = new google.maps.Marker({
      position: final,
      map: this.mapdiv,
      icon: iconoFin,
    });

    directionsDisplay.setOptions({suppressMarkers: true}); //Esta linea sirve para poder poner el tipo de  marcadores que quiera!!! :)

    // Se envuelve en una promesa para que crearRuta() no termine (y el círculo de
    // carga no se cierre) hasta que Google responda y se dibuje la ruta.
    await new Promise<void>((resolve) => {
      directionsService.route(
        {
          origin: inicio,
          destination: final,
          avoidTolls: true,
          avoidHighways: false,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (response: any, status: any) => {
          if (status === 'OK') {
            directionsDisplay.setDirections(response);
            // console.log("promesa exitosa");
          } else {
            // No se molesta al usuario con un alert; solo se registra el motivo.
            console.warn('Mensaje en consola Directions request: ' + status);
          }
          resolve();
        },
      );
    });

    // Mostrar trafico
    let trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(this.mapdiv);
  }

  // Se Actualiza la posicion del marker original
  updatePosition() {
    var myLatLng = {lat: this.Mylat, lng: this.Mylong};
    this.marker.setPosition(myLatLng);
    this.mapdiv.setCenter(myLatLng);
  }

  // Aqui se va a pintar la ruta desde la posicion del disp hasta el objetivo

  // Aqui se pinta el recorrios que se ha realziado
  drawRoute() {
    new google.maps.Polyline({
      path: this.recorrido,
      geodesic: true,
      strokeColor: '#424242',
      strokeOpacity: 0.9,
      strokeWeight: 3,
      map: this.mapdiv,
    });
  }

  // Esto es para mostrar los recorridos, creo que no se van a mostrar--------------------------------------------------

  // Se pinttan el marker de inicio de un recorrido
  drawMarkerInicial(coords: any) {
    let iconoInicio = './assets/imgs/RADIO_ACTIVO.svg';
    var myLatLng = coords;
    var inicio = new google.maps.Marker({
      position: myLatLng,
      map: this.mapdiv,
      title: 'Inicio de recorrido!',
      icon: iconoInicio,
    });
    return inicio;
  }

  // Esta funcion dibuja el markadpr del final de un recorrido
  drawMarkerFinal(coords: any) {
    let icono = './assets/imgs/truck.png';
    var myLatLng = coords;
    var inicio = new google.maps.Marker({
      position: myLatLng,
      map: this.mapdiv,
      title: 'fin de recorrido!',
      icon: icono,
    });
  }

  async ViewRecorridos() {
    console.log(
      ' Mensaje en consola Se muestran los recorridos locales',
      JSON.stringify(this.recorridosLocales),
    );

    // Crear el modal
    const modal = await this.modalCtrl.create({
      component: MisRecorridosPage, // Página o componente del modal
      componentProps: {
        opciones: this.recorridosLocales, // Pasar propiedades al componente del modal
      },
    });

    // Presentar el modal
    await modal.present();

    // Manejar el cierre del modal
    const {data} = await modal.onDidDismiss(); // Esperar a que el modal se cierre

    if (data) {
      console.log(data.opcion); // Procesar los datos recibidos
      this.DibujarRutas(data.opcion);
    }
  }

  makeRoute(coords: any[]) {
    // Aqui se pinta la ruta que se recibio
    new google.maps.Polyline({
      path: coords,
      geodesic: true,
      strokeColor: '#008997',
      map: this.mapdiv,
    });
  }

  // Se pinttan las rutas guardadas de los recorridos
  DibujarRutas(recorrido: any) {
    this.mapdiv = this.loadMapRoutes(recorrido.inicio);
    if (recorrido.inicio) {
      setTimeout(() => {
        this.drawMarkerInicial(recorrido.inicio);
      }, 1000);
    }
    if (recorrido.fin) {
      setTimeout(() => {
        this.drawMarkerFinal(recorrido.fin);
      }, 1000);
    }
    let reco: any[] = [];
    reco = [recorrido.inicio, recorrido.fin];
    this.makeRoute(reco);
  }

  cancelar2() {
    this.openbottom4 = false;
    this.openbottom3 = false;
  }

  cancelar3() {
    this.openbottom5 = false;
  }
}
