#!/usr/bin/env node
/**
 * Generador de códigos de acceso para "Mis Mensajeros" (uso en terminal).
 *
 * Genera un token firmado con HMAC-SHA256 y fecha de expiración, idéntico al
 * que valida la app. NO requiere conexión: la validación es local.
 *
 * Uso:
 *   node herramientas/generar-token.js                 -> 7 días por defecto
 *   node herramientas/generar-token.js 30              -> 30 días
 *   node herramientas/generar-token.js --fecha 2026-12-31T23:59
 *
 * ⚠️ El secreto debe coincidir EXACTAMENTE con ACCESO_SECRET en
 *    src/providers/config/config.services.ts
 */

const crypto = require('crypto');

// ⚠️ DEBE SER IDÉNTICO a ACCESO_SECRET en config.services.ts
const ACCESO_SECRET =
  'Mm-2026-Pq#cl4v3-Acc3so-d3v-CAMBIAR-antes-del-lanzamiento';

const PREFIJO = 'MM';
const LONG_FIRMA = 10; // caracteres hex incluidos en el código

function hmacHex(msg) {
  return crypto
    .createHmac('sha256', ACCESO_SECRET)
    .update(msg)
    .digest('hex')
    .toUpperCase();
}

function generarCodigo(expiraDate) {
  const expSeg = Math.floor(expiraDate.getTime() / 1000);
  const expB36 = expSeg.toString(36).toUpperCase();
  const payload = `${PREFIJO}-${expB36}`;
  const firma = hmacHex(payload).slice(0, LONG_FIRMA);
  return `${PREFIJO}-${expB36}-${firma}`;
}

// ---- Parseo de argumentos ----
const args = process.argv.slice(2);
let expira;

const idxFecha = args.indexOf('--fecha');
if (idxFecha !== -1) {
  const valor = args[idxFecha + 1];
  expira = new Date(valor);
  if (isNaN(expira.getTime())) {
    console.error('Fecha inválida. Ej: --fecha 2026-12-31T23:59');
    process.exit(1);
  }
} else {
  const dias = args[0] && /^\d+$/.test(args[0]) ? parseInt(args[0], 10) : 7;
  expira = new Date(Date.now() + dias * 86400 * 1000);
}

// ---- Salida ----
const codigo = generarCodigo(expira);
const fechaTxt = expira.toLocaleString('es-MX', {
  dateStyle: 'long',
  timeStyle: 'short',
});

console.log('');
console.log('  Código de acceso · Mis Mensajeros');
console.log('  ─────────────────────────────────');
console.log('  Código : ' + codigo);
console.log('  Expira : ' + fechaTxt);
console.log('');
