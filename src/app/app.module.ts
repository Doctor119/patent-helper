import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AboutComponent } from './about/about.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';
import { HomeComponent } from './home/home.component';
import { CpcComponent } from './cpc/cpc.component';
import { PrelimSearchComponent } from './prelim-search/prelim-search.component';

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
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
