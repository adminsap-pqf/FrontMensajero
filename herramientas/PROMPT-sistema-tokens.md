# Prompt: Implementar sistema de acceso por tokens (Angular)

Copia y pega TODO lo que sigue a tu asistente de IA (o úsalo como especificación
para un desarrollador). Está pensado para un proyecto **Angular** (funciona igual
con **Ionic/Angular**; solo la pantalla de activación usa componentes de Ionic que
puedes cambiar por HTML normal).

---

## CONTEXTO / OBJETIVO

Quiero agregar a mi aplicación Angular un **control de acceso por códigos (tokens)
con expiración**, que se valide **100% del lado del cliente** (sin llamar a ningún
servidor). Los códigos se generan con una herramienta de escritorio y se le entregan
al usuario; al abrir la app, si no hay un token válido y vigente, se le redirige a
una pantalla de "Activación" donde ingresa el código.

La seguridad se basa en una **firma HMAC-SHA256** con un **secreto compartido** que
vive tanto en la app como en el generador de tokens. La validación recalcula la firma
y verifica la fecha de expiración.

## FORMATO DEL TOKEN

```
MM-<expB36>-<firmaHex>
```

- `MM`      : prefijo fijo.
- `expB36`  : fecha de expiración (segundos unix) codificada en **base36**, en MAYÚSCULAS.
- `firmaHex`: primeros **10** caracteres hexadecimales (MAYÚSCULAS) de
              `HMAC_SHA256(secreto, "MM-<expB36>")`.

Ejemplo: `MM-TIJ6SP-7C1FD1A251`

## REQUISITOS DE IMPLEMENTACIÓN

Crea estos elementos:

### 1. Constante del secreto compartido
Archivo de configuración (ej. `src/providers/config/config.services.ts`):

```ts
/**
 * Secreto compartido para firmar/validar los códigos de acceso (HMAC-SHA256).
 * IMPORTANTE: este MISMO valor debe estar en la herramienta generadora de tokens.
 * Si lo cambias, todos los códigos emitidos previamente dejan de servir.
 * Mantenlo privado y cámbialo antes del lanzamiento.
 */
export const ACCESO_SECRET = 'CAMBIA-ESTE-SECRETO-por-uno-privado-largo';
```

### 2. Servicio `AccesoService` (la lógica principal)
- Usa la **Web Crypto API** del navegador (`crypto.subtle`) para el HMAC-SHA256
  (no requiere librerías externas).
- Guarda el token vigente en `localStorage` bajo la clave `acceso_token`.
- Métodos públicos:
  - `tieneAccesoVigente(): boolean` — síncrono (para usarse en un guard). Lee el token
    de localStorage, valida el formato y que la fecha de expiración sea futura. Si está
    expirado, lo borra y devuelve false.
  - `getExpiracion(): Date | null` — fecha de expiración del token guardado.
  - `validarYGuardar(codigo: string): Promise<ResultadoAcceso>` — normaliza el código,
    verifica prefijo/formato, recalcula la firma y la compara, valida expiración; si todo
    ok, lo guarda en localStorage.
  - `limpiar(): void` — borra el acceso (logout/revocar).
- Interfaz de resultado:
  ```ts
  export interface ResultadoAcceso {
    valido: boolean;
    expira?: Date;
    motivo?: 'formato' | 'firma' | 'expirado' | 'ok';
  }
  ```
- Detalles de la validación:
  - Normalizar: quitar espacios, convertir guiones largos (– —) a `-`, pasar TODO a MAYÚSCULAS.
  - Separar por `-` → deben ser 3 partes y la primera debe ser `MM`.
  - `payload = "MM-" + expB36`; `firmaEsperada = HMAC_HEX(payload)`.
  - Comparar `firmaRecibida === firmaEsperada.slice(0, firmaRecibida.length)`.
  - `expSegundos = parseInt(expB36, 36)`; `expira = new Date(expSegundos * 1000)`.
  - Si `expira <= ahora` → motivo `'expirado'`.
- Helper HMAC (Web Crypto):
  ```ts
  private async hmacHex(msg: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(ACCESO_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const firma = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
    return Array.from(new Uint8Array(firma))
      .map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  ```

### 3. Guard `AccesoGuard` (protege las rutas)
- Implementa `CanActivate`.
- Si `acceso.tieneAccesoVigente()` → `return true`.
- Si no → `return router.createUrlTree(['/activacion'])`.
- (Opcional) permite "desactivar" el sistema con un `return true;` al inicio, comentado.

### 4. Rutas
- Registrar una ruta `activacion` (SIN guard) que cargue la pantalla de activación.
- Poner `canActivate: [AccesoGuard]` en las rutas que quieras proteger (login, home, etc.).

### 5. Pantalla de Activación (`ActivacionComponent`)
- Un input para el código y un botón "Activar".
- Al activar: llama `validarYGuardar(codigo)`; si es válido, navega a la ruta principal
  y muestra "Acceso activado". Si no, muestra el mensaje según `motivo`
  (`expirado` → "Este código ya expiró"; `firma`/`formato` → "Código inválido").
- En `ionViewWillEnter`/`ngOnInit`: si ya hay acceso vigente, redirige directo a la app.
- (Si NO usas Ionic: reemplaza `ToastController` por cualquier sistema de notificación
  o un `alert()`, y `ion-*` por HTML normal.)

### 6. Generador de tokens (Node.js, uso en terminal)
Archivo `herramientas/generar-token.js`. Debe usar el **MISMO** `ACCESO_SECRET`.
Usa el módulo `crypto` nativo de Node:

```js
const crypto = require('crypto');
const ACCESO_SECRET = 'CAMBIA-ESTE-SECRETO-por-uno-privado-largo'; // idéntico al de la app
const PREFIJO = 'MM';
const LONG_FIRMA = 10;

function hmacHex(msg) {
  return crypto.createHmac('sha256', ACCESO_SECRET).update(msg).digest('hex').toUpperCase();
}
function generarCodigo(expiraDate) {
  const expSeg = Math.floor(expiraDate.getTime() / 1000);
  const expB36 = expSeg.toString(36).toUpperCase();
  const firma = hmacHex(`${PREFIJO}-${expB36}`).slice(0, LONG_FIRMA);
  return `${PREFIJO}-${expB36}-${firma}`;
}
// args: [dias] o "--fecha 2026-12-31T23:59"; por defecto 7 días.
```

Uso:
```
node herramientas/generar-token.js            # 7 días
node herramientas/generar-token.js 30         # 30 días
node herramientas/generar-token.js --fecha 2026-12-31T23:59
```

## PUNTOS CRÍTICOS QUE DEBE RESPETAR LA IMPLEMENTACIÓN

1. El `ACCESO_SECRET` debe ser **idéntico** en la app y en el generador, byte por byte.
2. La firma en la app se compara **cortando** a la misma longitud de la firma recibida
   (`slice(0, firma.length)`), y **todo en MAYÚSCULAS**.
3. `expB36` es base36 de segundos unix (no milisegundos).
4. La validación es **local**: no hay endpoint ni backend involucrado.
5. `localStorage` es por-origen: si la app cambia de dominio/esquema, el token se pierde.

## LO QUE NO DEBE HACER

- No inventar llamadas a un servidor para validar.
- No usar librerías de criptografía externas: en la app usa Web Crypto (`crypto.subtle`),
  en Node usa el módulo `crypto` nativo.
- No cambiar el formato del token ni el algoritmo (HMAC-SHA256) sin actualizar AMBOS lados.

## ENTREGABLES ESPERADOS

1. `config.services.ts` con `ACCESO_SECRET`.
2. `acceso.service.ts` (`AccesoService`) completo.
3. `acceso.guard.ts` (`AccesoGuard`).
4. Rutas actualizadas (`app-routing.module.ts`).
5. `activacion.component.ts` + su template.
6. `herramientas/generar-token.js`.

> NOTA DE SEGURIDAD: este esquema evita compartir un servidor de licencias, pero el
> secreto está embebido en el bundle de la app; un usuario avanzado podría extraerlo.
> Es un control de acceso "de conveniencia" (evita uso casual/no autorizado), no una
> barrera criptográfica fuerte. Para algo robusto, valida los tokens contra un backend.
