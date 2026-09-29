package io.ionic.starter.evidencias;

import android.content.Context;
import android.util.Base64;
import android.util.Base64OutputStream;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class EvidenciasWorker extends Worker {

    private static final String TAG = "EvidenciasWorker";
    static final String NOMBRE_TRABAJO = "evidencias-cola";

    private static final int MAX_INTENTOS = 5;
    private static final int TIMEOUT_CONEXION_MS = 30_000;
    private static final int TIMEOUT_LEGACY_MS = 300_000;
    private static final int TIMEOUT_FOTO_MS = 90_000;
    private static final Charset UTF8 = Charset.forName("UTF-8");

    private enum Resultado { OK, SIN_RED, RECHAZADO }

    public EvidenciasWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    public static void programar(Context context) {
        Constraints restricciones = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();
        OneTimeWorkRequest solicitud = new OneTimeWorkRequest.Builder(EvidenciasWorker.class)
                .setConstraints(restricciones)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                .build();
        WorkManager.getInstance(context)
                .enqueueUniqueWork(NOMBRE_TRABAJO, ExistingWorkPolicy.KEEP, solicitud);
    }

    @NonNull
    @Override
    public Result doWork() {
        boolean reintentar = false;
        boolean huboTrabajo = true;
        while (huboTrabajo && !isStopped()) {
            huboTrabajo = false;
            for (File dir : carpetasPendientes()) {
                if (isStopped()) {
                    return Result.retry();
                }
                JSONObject t = leer(dir);
                if (t == null) {
                    continue;
                }
                String estado = t.optString("estado");
                if (!"PENDIENTE".equals(estado) && !"SUBIENDO".equals(estado)) {
                    continue;
                }
                huboTrabajo = true;
                Resultado r = procesar(dir, t);
                if (r == Resultado.SIN_RED) {
                    return Result.retry();
                }
                if (r == Resultado.RECHAZADO) {
                    reintentar = true;
                }
            }
            if (reintentar) {
                break;
            }
        }
        return reintentar ? Result.retry() : Result.success();
    }

    private List<File> carpetasPendientes() {
        File cola = new File(getApplicationContext().getFilesDir(), "evidencias/cola");
        File[] carpetas = cola.listFiles(File::isDirectory);
        List<File> lista = new ArrayList<>();
        if (carpetas == null) {
            return lista;
        }
        Collections.addAll(lista, carpetas);
        Collections.sort(lista, (a, b) -> {
            JSONObject ta = leer(a);
            JSONObject tb = leer(b);
            long ca = ta == null ? 0 : ta.optLong("creado");
            long cb = tb == null ? 0 : tb.optLong("creado");
            return Long.compare(ca, cb);
        });
        return lista;
    }

    private Resultado procesar(File dir, JSONObject t) {
        try {
            t.put("estado", "SUBIENDO");
            guardar(dir, t);

            boolean v2 = "v2".equals(t.optString("protocolo"));
            Resultado r = v2 ? subirV2(dir, t) : subirLegacy(dir, t);

            if (r == Resultado.OK) {
                t.put("ultimoError", JSONObject.NULL);
                if (v2) {
                    t.put("estado", "ENVIADO");
                } else {
                    t.put("estado", "COMPLETADO");
                    borrarFotos(dir, t.optInt("total"));
                }
            } else if (r == Resultado.RECHAZADO) {
                int intentos = t.optInt("intentos") + 1;
                t.put("intentos", intentos);
                t.put("estado", intentos >= MAX_INTENTOS ? "ERROR" : "PENDIENTE");
            } else {
                t.put("estado", "PENDIENTE");
            }
            guardar(dir, t);
            return r;
        } catch (JSONException | IOException e) {
            Log.e(TAG, "No se pudo actualizar el trabajo " + dir.getName(), e);
            return Resultado.RECHAZADO;
        }
    }


    private Resultado subirLegacy(File dir, JSONObject t) throws JSONException {
        int total = t.optInt("total");
        String folio = t.optString("folioEvento");
        byte[] inicio = ("{\"archivos\":[" + JSONObject.quote(folio) + "]"
                + ",\"valor\":" + JSONObject.quote(t.optString("valor"))
                + ",\"tipo\":" + JSONObject.quote(t.optString("tipo"))
                + ",\"fotos\":[").getBytes(UTF8);
        byte[] fin = "]}".getBytes(UTF8);

        long largo = inicio.length + fin.length;
        for (int i = 0; i < total; i++) {
            long n = foto(dir, i).length();
            largo += 4 * ((n + 2) / 3) + 2;
            if (i > 0) {
                largo += 1;
            }
        }

        HttpURLConnection c = null;
        try {
            c = abrir(t.optString("urlBase") + "guardarFotos", TIMEOUT_LEGACY_MS);
            c.setRequestProperty("Content-Type", "application/json");
            c.setFixedLengthStreamingMode(largo);

            OutputStream out = new BufferedOutputStream(c.getOutputStream(), 64 * 1024);
            out.write(inicio);
            for (int i = 0; i < total; i++) {
                if (i > 0) {
                    out.write(',');
                }
                out.write('"');
                Base64OutputStream b64 = new Base64OutputStream(new SinCerrar(out), Base64.NO_WRAP);
                copiar(foto(dir, i), b64);
                b64.close();
                out.write('"');
            }
            out.write(fin);
            out.close();

            return respuesta(c, t);
        } catch (IOException e) {
            return sinRed(t, e);
        } finally {
            if (c != null) {
                c.disconnect();
            }
        }
    }


    private Resultado subirV2(File dir, JSONObject t) throws JSONException, IOException {
        String urlBase = t.optString("urlBase");
        String idSubida = t.optString("idSubida");
        int total = t.optInt("total");
        JSONArray subidas = t.optJSONArray("subidas");
        if (subidas == null) {
            subidas = new JSONArray();
            t.put("subidas", subidas);
        }

        for (int i = 0; i < total; i++) {
            if (contiene(subidas, i)) {
                continue;
            }
            Resultado r = subirFotoV2(urlBase, t, i, foto(dir, i));
            if (r != Resultado.OK) {
                return r;
            }
            subidas.put(i);
            guardar(dir, t);
        }

        JSONObject confirmar = new JSONObject();
        confirmar.put("idSubida", idSubida);
        confirmar.put("folioEvento", t.optString("folioEvento"));
        confirmar.put("total", total);
        confirmar.put("valor", t.optString("valor"));
        confirmar.put("tipo", t.optString("tipo"));
        byte[] cuerpo = confirmar.toString().getBytes(UTF8);

        HttpURLConnection c = null;
        try {
            c = abrir(urlBase + "evidencia/confirmar", TIMEOUT_FOTO_MS);
            c.setRequestProperty("Content-Type", "application/json");
            c.setFixedLengthStreamingMode(cuerpo.length);
            OutputStream out = c.getOutputStream();
            out.write(cuerpo);
            out.close();
            return respuesta(c, t);
        } catch (IOException e) {
            return sinRed(t, e);
        } finally {
            if (c != null) {
                c.disconnect();
            }
        }
    }

    private Resultado subirFotoV2(String urlBase, JSONObject t, int indice, File archivo)
            throws JSONException {
        String limite = "----evidencia" + System.currentTimeMillis();
        ByteArrayOutputStream campos = new ByteArrayOutputStream();
        try {
            campo(campos, limite, "idSubida", t.optString("idSubida"));
            campo(campos, limite, "indice", String.valueOf(indice));
            campo(campos, limite, "total", String.valueOf(t.optInt("total")));
            campo(campos, limite, "folioEvento", t.optString("folioEvento"));
            campos.write(("--" + limite + "\r\n"
                    + "Content-Disposition: form-data; name=\"archivo\"; filename=\"" + indice + ".jpg\"\r\n"
                    + "Content-Type: image/jpeg\r\n\r\n").getBytes(UTF8));
        } catch (IOException e) {
            return Resultado.RECHAZADO;
        }
        byte[] inicio = campos.toByteArray();
        byte[] fin = ("\r\n--" + limite + "--\r\n").getBytes(UTF8);

        HttpURLConnection c = null;
        try {
            c = abrir(urlBase + "evidencia/foto", TIMEOUT_FOTO_MS);
            c.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + limite);
            c.setFixedLengthStreamingMode(inicio.length + archivo.length() + fin.length);
            OutputStream out = new BufferedOutputStream(c.getOutputStream(), 64 * 1024);
            out.write(inicio);
            copiar(archivo, out);
            out.write(fin);
            out.close();
            return respuesta(c, t);
        } catch (IOException e) {
            return sinRed(t, e);
        } finally {
            if (c != null) {
                c.disconnect();
            }
        }
    }

    private static void campo(OutputStream out, String limite, String nombre, String valor)
            throws IOException {
        out.write(("--" + limite + "\r\n"
                + "Content-Disposition: form-data; name=\"" + nombre + "\"\r\n\r\n"
                + valor + "\r\n").getBytes(UTF8));
    }


    private static HttpURLConnection abrir(String url, int timeoutLectura) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setRequestMethod("POST");
        c.setDoOutput(true);
        c.setConnectTimeout(TIMEOUT_CONEXION_MS);
        c.setReadTimeout(timeoutLectura);
        return c;
    }

    private Resultado respuesta(HttpURLConnection c, JSONObject t) throws IOException, JSONException {
        int codigo = c.getResponseCode();
        if (codigo >= 200 && codigo < 300) {
            return Resultado.OK;
        }
        t.put("ultimoError", "El servidor respondió " + codigo + ".");
        Log.w(TAG, "Rechazo " + codigo + " para " + t.optString("folioEvento"));
        return Resultado.RECHAZADO;
    }

    private Resultado sinRed(JSONObject t, IOException e) {
        Log.w(TAG, "Sin red para " + t.optString("folioEvento") + ": " + e);
        try {
            t.put("ultimoError", e instanceof java.net.SocketTimeoutException
                    ? "El servidor no respondió a tiempo."
                    : "Sin conexión con el servidor.");
        } catch (JSONException ignorada) {
        }
        return Resultado.SIN_RED;
    }

    private static File foto(File dir, int indice) {
        return new File(dir, indice + ".jpg");
    }

    private static void borrarFotos(File dir, int total) {
        for (int i = 0; i < total; i++) {
            foto(dir, i).delete();
        }
    }

    private static boolean contiene(JSONArray arreglo, int valor) {
        for (int i = 0; i < arreglo.length(); i++) {
            if (arreglo.optInt(i, -1) == valor) {
                return true;
            }
        }
        return false;
    }

    private static void copiar(File archivo, OutputStream out) throws IOException {
        InputStream in = new FileInputStream(archivo);
        try {
            byte[] buf = new byte[32 * 1024];
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
            }
        } finally {
            in.close();
        }
    }

    private static JSONObject leer(File dir) {
        for (String nombre : new String[] {"trabajo.json", "trabajo.json.tmp"}) {
            File f = new File(dir, nombre);
            if (!f.exists()) {
                continue;
            }
            try {
                ByteArrayOutputStream buf = new ByteArrayOutputStream();
                copiar(f, buf);
                return new JSONObject(new String(buf.toByteArray(), UTF8));
            } catch (IOException | JSONException e) {
            }
        }
        return null;
    }

    private static void guardar(File dir, JSONObject t) throws IOException, JSONException {
        t.put("actualizado", System.currentTimeMillis());
        File tmp = new File(dir, "trabajo.json.tmp");
        FileOutputStream out = new FileOutputStream(tmp);
        try {
            out.write(t.toString().getBytes(UTF8));
            out.getFD().sync();
        } finally {
            out.close();
        }
        if (!tmp.renameTo(new File(dir, "trabajo.json"))) {
            throw new IOException("No se pudo guardar trabajo.json");
        }
    }

    private static class SinCerrar extends FilterOutputStream {
        SinCerrar(OutputStream out) {
            super(out);
        }

        @Override
        public void write(@NonNull byte[] b, int off, int len) throws IOException {
            out.write(b, off, len);
        }

        @Override
        public void close() throws IOException {
            flush();
        }
    }
}
