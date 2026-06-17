import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { COLORSMAPS } from '../../../../utils/MapTheme';
import { Subscription } from 'rxjs';
import { Recorrido } from '../../../../classes/Recorrido';
import { StorageProvider } from '../../../../providers/storage/storage';
import { ModalController, NavController } from '@ionic/angular';
import { PendientesProvider } from '../../../../providers/pendientes/pendientes';
import { ComunService } from '../../../../providers/comun/comun';
import { Geolocation, Position } from '@capacitor/geolocation';
import { ActivatedRoute } from '@angular/router';
import { MisRecorridosPage } from './mis-recorridos/mis-recorridos';
import { AppLauncher } from '@capacitor/app-launcher';

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
  dlong: any;
  dlongP: any;
  degtorad: any = 0.01745329;

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

  async ionViewDidLoad() {
    console.log('Mensaje en consola Entró a ionViewDidLoad');
    this.activatedRoute.queryParams.subscribe(async (params: any) => {
      this.pendientes = JSON.parse(params.pendientes);
      console.log('Mensaje en consola Pendientes recibidos:', this.pendientes);
      console.log('Mensaje en consola Pendientes recibidos:', this.pendientes);

      // Obtener la ubicación actual
      const position = await Geolocation.getCurrentPosition();
      this.Mylat = position.coords.latitude;
      this.Mylong = position.coords.longitude;

      console.log('Latitud:', this.Mylat);
      console.log('Longitud:', this.Mylong);

      // Llamar a los métodos para cargar el mapa y crear la ruta
      this.mapdiv = this.loadMap();
      this.marker = this.crearRuta();
    });
  }

  ionViewDidEnter() {
    console.log('Mensaje en consola Entró a ionViewDidEnter');
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

  validarUbicacion() {
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

    this.dlongP = -longitudP + this.longitudActual;
    distanciaP =
      Math.sin(latitudP * this.degtorad) *
      Math.sin(this.latitudActual * this.degtorad) +
      Math.cos(latitudP * this.degtorad) *
      Math.cos(this.latitudActual * this.degtorad) *
      Math.cos(this.dlongP * this.degtorad);
    distanciaP = Math.acos(distanciaP) * 6371000;

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
    if (
      this.items[0].actualizar ||
      (latitud == 0 && longitud == 0 && distanciaP > 1000)
    ) {
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
    } else {
      if (latitud != 0 && longitud != 0) {
        this.dlong = -longitud + this.longitudActual;

        distancia =
          Math.sin(latitud * this.degtorad) *
          Math.sin(this.latitudActual * this.degtorad) +
          Math.cos(latitud * this.degtorad) *
          Math.cos(this.latitudActual * this.degtorad) *
          Math.cos(this.dlong * this.degtorad);
        distancia = Math.acos(distancia) * 6371000;
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
    let latitud: any = this._proquifa[0];
    let longitud: any = this._proquifa[1];
    let distancia: any = 0;
    this.dlong = -longitud + this.longitudActual;

    distancia =
      Math.sin(latitud * this.degtorad) *
      Math.sin(this.latitudActual * this.degtorad) +
      Math.cos(latitud * this.degtorad) *
      Math.cos(this.latitudActual * this.degtorad) *
      Math.cos(this.dlong * this.degtorad);
    distancia = Math.acos(distancia) * 6371000;

    if (distancia < 1000) {
      this.isProquifa = true;
    } else {
      this.isProquifa = false;
    }
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

  // Se Crean los primeros markadores
  crearRuta() {
    // this.isTracking = true;;
    console.log('--------->', this.coordenadasT);

    let inicio = new google.maps.LatLng(this.Mylat, this.Mylong);
    let final = this.coordenadasT;

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

    directionsService.route(
      {
        origin: inicio,
        destination: final,
        avoidTolls: true,
        avoidHighways: false,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      function (response: any, status: any) {
        if (status === 'OK') {
          directionsDisplay.setDirections(response);
          // console.log("promesa exitosa");
        } else {
          window.alert('Directions request failed due to ' + status);
          // console.log("promesa fallida");
        }
      },
    );

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
