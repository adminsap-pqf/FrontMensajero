import { Injectable } from '@angular/core';
import { ACCESO_SECRET } from '../config/config.services';

/**
 * Resultado de validar un código de acceso.
 */
export interface ResultadoAcceso {
  valido: boolean;
  expira?: Date;
  motivo?: 'formato' | 'firma' | 'expirado' | 'ok';
}

const STORAGE_KEY = 'acceso_token';
const PREFIJO = 'MM';

/**
 * Servicio de control de acceso por tokens con expiración.
 *
 * El código tiene el formato:   MM-<expB36>-<firmaHex>
 *   - expB36:   fecha de expiración (segundos unix) en base36.
 *   - firmaHex: primeros bytes de HMAC-SHA256(secreto, "MM-<expB36>").
 *
 * La validación es 100% local (no requiere servidor): se recalcula la firma
 * con el secreto compartido y se compara, luego se verifica la expiración.
 *
 * Los códigos se generan desde la herramienta de escritorio
 * (herramientas/generador-token.html) que usa el mismo secreto.
 */
@Injectable({
  providedIn: 'root',
})
export class AccesoService {
  /** Token vigente cargado en memoria (si lo hay). */
  private tokenActual: string | null = null;
  private expiraActual: Date | null = null;

  /**
   * Indica si actualmente hay un acceso válido y no expirado.
   * Lee de localStorage de forma síncrona para poder usarse en un guard.
   */
  tieneAccesoVigente(): boolean {
    const token = this.tokenActual ?? localStorage.getItem(STORAGE_KEY);
    if (!token) {
      return false;
    }
    const exp = this.expDeToken(token);
    if (exp === null) {
      return false;
    }
    if (exp.getTime() <= Date.now()) {
      this.limpiar();
      return false;
    }
    return true;
  }

  /** Fecha de expiración del acceso vigente, si existe. */
  getExpiracion(): Date | null {
    const token = this.tokenActual ?? localStorage.getItem(STORAGE_KEY);
    return token ? this.expDeToken(token) : null;
  }

  /**
   * Valida un código ingresado por el usuario. Si es válido, lo guarda como
   * acceso vigente.
   */
  async validarYGuardar(codigo: string): Promise<ResultadoAcceso> {
    const normalizado = this.normalizar(codigo);
    const partes = normalizado.split('-');

    if (partes.length !== 3 || partes[0] !== PREFIJO) {
      return { valido: false, motivo: 'formato' };
    }

    const [, expB36, firma] = partes;
    const payload = `${PREFIJO}-${expB36}`;
    const firmaEsperada = await this.hmacHex(payload);

    // Compara los mismos bytes que se incluyen en el código (todo en mayúsculas).
    if (firma !== firmaEsperada.slice(0, firma.length)) {
      return { valido: false, motivo: 'firma' };
    }

    const expSegundos = parseInt(expB36, 36);
    if (isNaN(expSegundos)) {
      return { valido: false, motivo: 'formato' };
    }
    const expira = new Date(expSegundos * 1000);

    if (expira.getTime() <= Date.now()) {
      return { valido: false, expira, motivo: 'expirado' };
    }

    // Guardar como acceso vigente.
    this.tokenActual = normalizado;
    this.expiraActual = expira;
    localStorage.setItem(STORAGE_KEY, normalizado);

    return { valido: true, expira, motivo: 'ok' };
  }

  /** Elimina el acceso vigente (p. ej. al expirar o al revocar). */
  limpiar(): void {
    this.tokenActual = null;
    this.expiraActual = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  // ---- Helpers internos ----

  /** Extrae y verifica superficialmente la fecha de expiración del token guardado. */
  private expDeToken(token: string): Date | null {
    const partes = token.split('-');
    if (partes.length !== 3 || partes[0] !== PREFIJO) {
      return null;
    }
    const expSegundos = parseInt(partes[1], 36);
    if (isNaN(expSegundos)) {
      return null;
    }
    return new Date(expSegundos * 1000);
  }

  /** Normaliza el código: quita espacios, pasa a mayúsculas el prefijo y deja el resto en minúsculas. */
  private normalizar(codigo: string): string {
    const limpio = (codigo || '')
      .trim()
      .replace(/\s+/g, '')
      .replace(/[–—]/g, '-'); // guiones largos -> guion normal
    return limpio.toUpperCase();
  }

  /** Calcula HMAC-SHA256(secreto, msg) y lo devuelve en hexadecimal (mayúsculas). */
  private async hmacHex(msg: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(ACCESO_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const firma = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
    return Array.from(new Uint8Array(firma))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }
}
