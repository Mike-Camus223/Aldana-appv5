import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideNoopAnimations(), // Reemplaza las animaciones en el servidor
    provideHttpClient(withFetch()), // Asegurar HttpClient en servidor
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
