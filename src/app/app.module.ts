import { BrowserModule, HAMMER_LOADER } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AboutComponent } from './about/about.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';
import { HomeComponent } from './home/home.component';
import { CpcComponent } from './cpc/cpc.component';
import { PrelimSearchComponent } from './prelim-search/prelim-search.component';

import { ConfigService } from './utility/config.service';
import { of, Observable, ObservableInput } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

function loadAPIKey(http: HttpClient, config: ConfigService): (() => Promise<boolean>) {
  return (): Promise<boolean> => {
    return new Promise<boolean>((resolve: (a: boolean) => void): void => {
      http.get('./rapidapikey.json')
        .pipe(
          map((x: ConfigService) => {
            config.rapidApiKey = x.rapidApiKey;
            resolve(true);
          }),
          catchError((x: {status: number}, caught: Observable<void>): ObservableInput<{}> => {
            if (x.status !== 404) {
              resolve(false);
            }
            config.rapidApiKey = "unknown";
            resolve(true);
            return of({});
          })
        ).subscribe();
    });
  };
}

@NgModule({
  declarations: [
    AppComponent,
    AboutComponent,
    DisclaimerComponent,
    HomeComponent,
    CpcComponent,
    PrelimSearchComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    HttpClient
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: loadAPIKey,
      multi: true,
      deps: [HttpClient, ConfigService]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
