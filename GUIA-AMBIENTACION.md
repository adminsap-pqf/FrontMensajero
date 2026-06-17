# Guía de Ambientación — AppMensajero

Guía paso a paso para preparar el entorno de desarrollo de **AppMensajero** en una máquina **Windows** desde cero, hasta poder correr la app en el **navegador** y compilarla para **Android**.

> Probado en Windows 11. Tiempo aproximado: 30–60 min (la mayor parte son descargas).

---

## 🧱 Stack tecnológico

| Tecnología | Versión |
|---|---|
| Node.js | **18.x** (obligatorio — ver nota abajo) |
| Ionic Framework | 6 (`@ionic/angular` ^6.7.5) |
| Angular | 15 |
| TypeScript | 4.9 |
| Capacitor | 6 |
| JDK (para Android) | **17** (lo exige Capacitor 6) |
| Android SDK | API 34 (build-tools 34.0.0) |

> ⚠️ **Node 18 es obligatorio.** Angular 15 **no** soporta Node 20/22/24 y dará errores al instalar o compilar. Usa exactamente la línea 18.x.

---

## ✅ Requisitos previos

- Windows 10/11 de 64 bits
- Conexión a internet (se descargan ~3–4 GB en total entre Android Studio y el SDK)
- **winget** (incluido en Windows 11; en Windows 10 se instala desde Microsoft Store como "App Installer")
- Permisos para aceptar ventanas de **UAC** (Control de cuentas de usuario)

Verifica que tienes winget:
```powershell
winget --version
```

---

## 🚀 Resumen rápido (TL;DR)

Si ya sabes lo que haces, estos son los comandos en orden. Si es tu primera vez, sigue las secciones detalladas más abajo.

```powershell
# 1. Gestor de versiones de Node + Node 18
winget install CoreyButler.NVMforWindows
# (abre una terminal NUEVA tras instalar nvm)
nvm install 18.20.8
nvm use 18.20.8

# 2. Ionic CLI global
npm install -g @ionic/cli

# 3. Dependencias del proyecto
cd C:\ruta\al\proyecto\AppMensajero-develop
npm install

# 4. Correr en navegador
ionic serve

# --- Para Android ---
# 5. JDK 17 y Android Studio
winget install EclipseAdoptium.Temurin.17.JDK
winget install Google.AndroidStudio
# 6. Abre Android Studio una vez para que descargue el SDK (ver Paso 7)
# 7. Configura JAVA_HOME y ANDROID_HOME (ver Paso 8)
# 8. Sincronizar y compilar
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

---

# Parte 1 — Entorno Web (mínimo para desarrollar)

## Paso 1 — Node 18 con nvm-windows

Usamos **nvm-windows** para poder tener Node 18 sin desinstalar otras versiones de Node que tengas.

```powershell
winget install CoreyButler.NVMforWindows -e --accept-source-agreements --accept-package-agreements
```
> Acepta la ventana de **UAC** que aparece.

**Cierra y abre una terminal NUEVA** (para que reconozca el comando `nvm`). Luego:

```powershell
nvm install 18.20.8
nvm use 18.20.8
node --version    # debe mostrar v18.20.8
```

> 💡 Si `nvm use` falla con un error de permisos, abre PowerShell **como Administrador** y vuelve a ejecutarlo (crea un enlace simbólico que requiere privilegios; en Windows con "Modo de desarrollador" activo funciona sin admin).

## Paso 2 — Ionic CLI

```powershell
npm install -g @ionic/cli
ionic --version   # 7.x está bien (es compatible con proyectos Ionic 6)
```

## Paso 3 — Dependencias del proyecto

```powershell
cd C:\ruta\al\proyecto\AppMensajero-develop
npm install
```
> Verás avisos de paquetes "deprecated" y de "vulnerabilities". Son **normales** en Angular 15. **NO** ejecutes `npm audit fix --force`: rompería las versiones del proyecto.

## Paso 4 — Correr en el navegador 🎉

```powershell
ionic serve
```
Se abrirá automáticamente en **http://localhost:8100**. La app de Ionic se ve igual en el navegador que en el móvil.

Para detener el servidor: `Ctrl + C` en la terminal.

---

# Parte 2 — Entorno Android (para compilar el APK)

## Paso 5 — JDK 17

Capacitor 6 requiere **Java 17** (ni 11 ni 21).

```powershell
winget install EclipseAdoptium.Temurin.17.JDK -e --accept-source-agreements --accept-package-agreements
```
> Acepta el **UAC**. Queda instalado en `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`.

## Paso 6 — Android Studio

```powershell
winget install Google.AndroidStudio -e --accept-source-agreements --accept-package-agreements
```
> Acepta el **UAC**. Es una descarga grande (~1.4 GB) + instalación; puede tardar. Si parece "congelado" al final, es la fase de copiar archivos (no muestra porcentaje) — **ten paciencia, no lo reinicies**.

## Paso 7 — Android SDK (API 34)

Tienes dos caminos. **El Método A es el más fácil.**

### Método A — Con el asistente de Android Studio (recomendado)

1. Abre **Android Studio**.
2. En el asistente de bienvenida ("Setup Wizard"), elige **Standard** y acepta las licencias.
3. Descargará automáticamente el SDK, platform-tools y la última plataforma.
4. Si necesitas exactamente la **API 34**: menú *More Actions → SDK Manager → SDK Platforms*, marca **Android 14 (API 34)** y aplica.

El SDK queda en: `C:\Users\<TU_USUARIO>\AppData\Local\Android\Sdk`

### Método B — Por línea de comandos, sin abrir Android Studio (avanzado)

Útil para servidores/CI o si prefieres no usar la interfaz gráfica.

```powershell
# 1. Descargar las command-line tools oficiales
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
New-Item -ItemType Directory -Force -Path $sdk | Out-Null
$zip = "$env:TEMP\cmdline-tools.zip"
Invoke-WebRequest "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip" -OutFile $zip
Expand-Archive $zip "$env:TEMP\cmdline-extract" -Force
New-Item -ItemType Directory -Force -Path "$sdk\cmdline-tools" | Out-Null
Move-Item "$env:TEMP\cmdline-extract\cmdline-tools" "$sdk\cmdline-tools\latest"

# 2. Instalar los componentes (acepta licencias respondiendo 'y')
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"  # ajusta a tu versión
$sm = "$sdk\cmdline-tools\latest\bin\sdkmanager.bat"
& $sm --licenses          # responde 'y' a todo
& $sm "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

> 🐛 **Problema conocido:** en PowerShell, pasar `y` a `sdkmanager` con un pipe (`echo y | sdkmanager`) **no funciona** (las licencias quedan sin aceptar y los paquetes se omiten con el mensaje *"Skipping... the license is not accepted"*). Solución alternativa: crear manualmente los archivos de licencia antes de instalar:
> ```powershell
> $lic = "$env:LOCALAPPDATA\Android\Sdk\licenses"
> New-Item -ItemType Directory -Force -Path $lic | Out-Null
> Set-Content "$lic\android-sdk-license" "`n24333f8a63b6825ea9c5514f83c2829b004d1fee`n8933bad161af4178b1185d1a37fbf41ea5269c55" -Encoding Ascii
> ```
> Luego vuelve a ejecutar el `sdkmanager ... install`.

## Paso 8 — Variables de entorno

Configura `JAVA_HOME` y `ANDROID_HOME` a nivel de **usuario** (no requiere admin):

```powershell
# JAVA_HOME (ajusta la ruta a tu versión exacta del JDK)
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot", "User")

# ANDROID_HOME
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdk, "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdk, "User")

# Agregar al PATH del usuario
$p = [Environment]::GetEnvironmentVariable("Path","User")
[Environment]::SetEnvironmentVariable("Path", "$p;%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin", "User")
```

**Cierra y abre una terminal nueva** para que tomen efecto. Verifica:
```powershell
java -version     # openjdk version "17..."
adb --version     # Android Debug Bridge ...
echo $env:ANDROID_HOME
```

## Paso 9 — Sincronizar y compilar Android

Desde la carpeta del proyecto:

```powershell
# 1. Generar el build web (crea la carpeta www)
npm run build

# 2. Sincronizar web + plugins de Capacitor con el proyecto Android
npx cap sync android

# 3. Compilar el APK (la primera vez tarda: descarga Gradle + dependencias)
cd android
.\gradlew.bat assembleDebug
```

El APK queda en:
`android\app\build\outputs\apk\debug\app-debug.apk`

> Si Gradle no encuentra el SDK, asegúrate de que existe el archivo `android\local.properties` con:
> ```
> sdk.dir=C\:\\Users\\<TU_USUARIO>\\AppData\\Local\\Android\\Sdk
> ```

---

## 📱 Correr en un dispositivo Android

Necesitas un emulador o un teléfono físico:

- **Emulador:** Android Studio → *Device Manager* → *Create Device* → elige un modelo y una imagen de sistema.
- **Teléfono físico:** activa *Opciones de desarrollador* → *Depuración USB* y conéctalo por USB.

Luego, desde la carpeta del proyecto:
```powershell
ionic cap run android
```

---

## 📋 Comandos del día a día

| Comando | Qué hace |
|---|---|
| `ionic serve` | Corre la app en el navegador (http://localhost:8100) |
| `npm run build` | Compila la web para producción (genera `www/`) |
| `npx cap sync android` | Sincroniza web + plugins con Android (tras cambios) |
| `ionic cap run android` | Corre la app en emulador/dispositivo |
| `ionic cap open android` | Abre el proyecto en Android Studio |
| `cd android; .\gradlew.bat assembleDebug` | Compila el APK de debug |
| `adb logcat \| findstr "Console"` | Ver logs de la app en Android |

---

## 🛠️ Solución de problemas

**`node` no es la versión 18 / errores raros al instalar o compilar**
Verifica con `node --version`. Si no es v18.x:
```powershell
nvm use 18.20.8
```

**`ionic` no se reconoce como comando**
Abre una terminal nueva tras `npm install -g @ionic/cli`. Si persiste, revisa que la carpeta global de npm esté en el PATH.

**Gradle: "SDK location not found" o no encuentra Java**
- Confirma `JAVA_HOME` (debe apuntar a un JDK **17**) y `ANDROID_HOME`.
- Confirma que existe `android\local.properties` con la línea `sdk.dir=...`.
- Abre una terminal nueva tras cambiar variables de entorno.

**sdkmanager: "Skipping... the license is not accepted"**
Ver la nota del **Paso 7, Método B** (crear los archivos de licencia manualmente).

**Aviso `bundledWebRuntime has been deprecated` al hacer `cap sync`**
Inofensivo. Puedes eliminar la línea `bundledWebRuntime: false` de `capacitor.config.ts`.

**Avisos de `npm audit` (vulnerabilities) tras `npm install`**
Normales por la antigüedad de Angular 15. **No** uses `npm audit fix --force`.

---

## 📂 Estructura relevante del proyecto

```
AppMensajero-develop/
├── src/                    # Código fuente Angular/Ionic (TypeScript)
├── android/                # Proyecto nativo Android (Capacitor)
│   ├── app/                # Módulo de la app
│   ├── local.properties    # Ruta al SDK (local, no se sube a git)
│   └── gradlew.bat         # Wrapper de Gradle
├── www/                    # Build web (se genera con npm run build)
├── capacitor.config.ts     # Configuración de Capacitor
├── package.json            # Dependencias y scripts
└── GUIA-AMBIENTACION.md    # Este documento
```

---

*Documento generado como guía de ambientación del entorno de desarrollo.*
