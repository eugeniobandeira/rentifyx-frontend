import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateMultiHttpLoader } from '@ngx-translate/http-loader';
import { provideTranslateService } from '@ngx-translate/core';
import { authInterceptor } from '@core/interceptors/auth/auth.interceptor';
import { httpErrorInterceptor } from '@core/interceptors/http-error/http-error.interceptor';
import { LanguageService } from '@core/services/language/language.service';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptors([httpErrorInterceptor, authInterceptor])),
    provideTranslateService({
      loader: provideTranslateMultiHttpLoader({
        resources: [
          { prefix: '/i18n/common/', suffix: '.json' },
          { prefix: '/i18n/auth/', suffix: '.json' },
          { prefix: '/i18n/assets/', suffix: '.json' },
        ],
      }),
      fallbackLang: 'pt-BR',
    }),
    provideAppInitializer(() => inject(LanguageService).init()),
  ]
};
