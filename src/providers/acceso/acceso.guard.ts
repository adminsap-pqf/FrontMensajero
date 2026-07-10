import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AccesoService } from './acceso';

/**
 * Guard que protege las rutas de la app. Si no hay un acceso vigente
 * (token válido y no expirado), redirige a la pantalla de activación.
 */
@Injectable({
  providedIn: 'root',
})
export class AccesoGuard implements CanActivate {
  constructor(
    private acceso: AccesoService,
    private router: Router,
  ) {}

  canActivate(): boolean | UrlTree {
    // TOKEN DESACTIVADO PARA PRODUCCIÓN: se permite el acceso sin código de
    // activación para que los usuarios puedan entrar sin problemas.
    // Para RE-ACTIVAR el sistema de token, elimina este `return true;` y
    // descomenta el bloque de abajo.
    return true;

    // if (this.acceso.tieneAccesoVigente()) {
    //   return true;
    // }
    // return this.router.createUrlTree(['/activacion']);
  }
}
