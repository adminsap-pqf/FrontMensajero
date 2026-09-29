import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { URL } from '../config/config.services'; // Trae las ips

@Injectable({
  providedIn: 'root',
})
export class PendientesProvider {
  private elementosAColectar: string = `${URL}consultarPendientesDeMensajeroPL`;
  private obtenerPersonalAlmacen: string = `${URL}obtenerPersonalAlmacenCliente`;
  private actualizarPersonalAlmacen: string = `${URL}actualizarPersonalAlmacenCliente`;
  private ejecutarRutaMensajeroPL: string = `${URL}ejecutarRutaMensajeroPL`;
  private consultarPendientesEnCierrePL: string = `${URL}consultarPendientesEnCierrePL`;
  private concluirEjecucionDeRuta: string = `${URL}concluirEjecucionDeRutaPL`;
  private guardarComentariosRutaDP: string = `${URL}guardarComentariosRutaDP`;
  private listarPendientesCerradosPL: string = `${URL}listarPendientesCerradosPL`;
  private apiURLguardarArchivo: string = `${URL}guardarFirma`;
  private apiURLvalidarCoordenadasGPS: string = `${URL}validarCoordenadasGPS`;
  private apiURLInsertarRecorrido: string = `${URL}insertarRecorrido`;
  private x: string = `${URL}upload`;

  constructor(private http: HttpClient) {}

  private createHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  private handleError(error: any): Observable<never> {
    return throwError(error.error || 'Server error');
  }

  elementosColectar(username: any): Observable<any> {
    const body = { valor: username, estado: 'AEjecutar' };
    return this.http
      .post(this.elementosAColectar, body, { headers: this.createHeaders() })
      .pipe(
        map((data) => data),
        catchError(this.handleError),
      );
  }

  ejecutarRuta(lstPendientes: any[]): Observable<any> {
    return this.http
      .post(this.ejecutarRutaMensajeroPL, lstPendientes, {
        headers: this.createHeaders(),
      })
      .pipe(
        map((data) => data),
        catchError(this.handleError),
      );
  }

  cerrarRuta(
    lstPendientes: any,
    idUsuario: number,
    username: any,
  ): Observable<any> {
    const body = { pendientes: lstPendientes, idUsuario, valor: username };
    return this.http
      .post(this.concluirEjecucionDeRuta, body, {
        headers: this.createHeaders(),
      })
      .pipe(
        map((data) => data),
        catchError(this.handleError),
      );
  }

  cerrarRutaDPNoRealizados(lstComentariosRutaDP: any): Observable<any> {
    const body = { comentaiosRutaDP: lstComentariosRutaDP };
    return this.http
      .post(this.guardarComentariosRutaDP, body, {
        headers: this.createHeaders(),
      })
      .pipe(
        map((data) => data),
        catchError(this.handleError),
      );
  }

  pendientes(username: any): Observable<any> {
    const body = { valor: username, estado: 'Colectado' };
    return this.http
      .post(this.elementosAColectar, body, { headers: this.createHeaders() })
      .pipe(
        map((data) => data),
        catchError(this.handleError),
      );
  }

  enCierre(username: any): Observable<any> {
    const body = { valor: username };
    return this.http
      .post(this.consultarPendientesEnCierrePL, body, {
        headers: this.createHeaders(),
      })
      .pipe(
        map((data) => data),
        catchError(this.handleError),
      );
  }

  clientes(id: any): Observable<any> {
    const body = { idCliente: id };
    return this.http
      .post(this.obtenerPersonalAlmacen, body, {
        headers: this.createHeaders(),
      })
      .pipe(
        map((data) => data),
        catchError(this.handleError),
      );
  }

  actualizarCliente(personal: any): Observable<any> {
    const body = { personal };
    return this.http
      .post(this.actualizarPersonalAlmacen, body, {
        headers: this.createHeaders(),
      })
      .pipe(
        map((data) => data),
        catchError(this.handleError),
      );
  }

  guardaDocumentacion(archivo: any): Observable<any> {
    return this.http
      .post(this.apiURLguardarArchivo, archivo, {
        headers: this.createHeaders(),
      })
      .pipe(
        map((data) => data),
        catchError(this.handleError),
      );
  }

  obtenerPendientesCerrados(username: any): Observable<any> {
    const body = { valor: username };
    return this.http
      .post(this.listarPendientesCerradosPL, body, {
        headers: this.createHeaders(),
      })
      .pipe(
        map((data) => data),
        catchError(this.handleError),
      );
  }

  validarCoordenadasGPS(lstPendientes: any): Observable<any> {
    const body = { pendientes: lstPendientes };
    return this.http
      .post(this.apiURLvalidarCoordenadasGPS, body, {
        headers: this.createHeaders(),
      })
      .pipe(
        map((data) => data),
        catchError(this.handleError),
      );
  }

  insertarRecorrido(recorrido: any): Observable<any> {
    return this.http
      .post(this.apiURLInsertarRecorrido, recorrido, {
        headers: this.createHeaders(),
      })
      .pipe(
        map((data) => data),
        catchError(this.handleError),
      );
  }
}
