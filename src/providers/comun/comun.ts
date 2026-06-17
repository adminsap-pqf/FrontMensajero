import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { URL } from '../config/config.services'; // Trae las IPs

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

  constructor(private http: HttpClient) {}

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
