//URL del servidor a donde se apuntara la app para obtener el backend
//Url de desarrollo
//export const URL = "http://192.168.2.100:8081/api/";
//export const URL = "http://172.24.32.14:8080/ProquifaNet/";

//URL del serrvidor de proquifaConnect
// export const URL = 'http://192.168.2.41:8081/ProquifaNet/'; //Desarrollo 2024
// export const URL = 'https://192.168.2.41:8443/ProquifaNet/';

export const URL = "https://pqnetangular.ryndem.mx/ProquifaNet/"; // PRODUCCION
//export const URL = "http://localhost:8081/api/"; // DESARROLLO LOCAL
//export const URL = "http://172.24.32.58:8080/ProquifaNet/"; // DESARROLLO SERVIDOR
//export const URL = "http://192.168.1.98:8081/api/"; // DESARROLLO SERVIDOR LOCAL
//export const URL ='http://172.24.20.12:8080/ProquifaNet/'
//export const URL = 'http://www.proquifaconnect.mx:8080/ProquifaNet/';

/**
 * Secreto compartido para firmar/validar los códigos de acceso (HMAC-SHA256).
 *
 * IMPORTANTE:
 *  - Este MISMO valor debe estar en la herramienta de escritorio
 *    (herramientas/generador-token.html) para que los códigos generados
 *    sean válidos en la app.
 *  - Si lo cambias, todos los códigos emitidos previamente dejarán de servir.
 *  - Mantenlo privado: cámbialo antes del lanzamiento oficial.
 */
export const ACCESO_SECRET =
  'Mm-2026-Pq#cl4v3-Acc3so-d3v-CAMBIAR-antes-del-lanzamiento';
