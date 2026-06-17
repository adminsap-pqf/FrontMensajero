import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Router, RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { LoginModule } from './pages/login/login.module';
import { TabsModule } from './components/tabs/tabs.module';
import { StorageProvider } from '../providers/storage/storage';
import { IonicStorageModule } from '@ionic/storage-angular';

export function resetOnReload(router: Router) {
  return () => {
    // Redirige a la ruta principal si la URL actual no es '/'
    if (window.location.pathname !== '/') {
      router.navigateByUrl('/');
    }
  };
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    IonicModule.forRoot({ mode: 'md' }),
    IonicStorageModule.forRoot(),
    HttpClientModule,
    LoginModule,
    TabsModule,
  ],
  providers: [
    /*StorageProvider,*/
    {
      provide: APP_INITIALIZER,
      useFactory: resetOnReload,
      deps: [Router],
      multi: true,
    },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
