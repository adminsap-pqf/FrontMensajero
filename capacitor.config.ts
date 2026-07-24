import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'MensajeroDEV',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    // Carga la app sobre http://localhost para poder llamar a backends HTTP
    // (p. ej. el servidor de pruebas http://172.24.32.58:8080). Sin esto, el
    // WebView bloquea las peticiones HTTP por "Mixed Content".
    // NOTA: para el lanzamiento oficial, lo correcto es que el backend sea
    // HTTPS y volver a 'https'.
    androidScheme: 'http',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
