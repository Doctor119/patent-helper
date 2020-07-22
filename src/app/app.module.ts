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
import { loadAPIKey } from './utility/api-key-loader';
import { CpcSearch } from './utility/cpc-search';

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
    HttpClientModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: loadAPIKey,
      multi: true,
      deps: [HttpClient, ConfigService]
    },
    CpcSearch
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
