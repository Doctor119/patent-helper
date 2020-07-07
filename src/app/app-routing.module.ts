import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { CpcComponent } from './cpc/cpc.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';
import { HomeComponent } from './home/home.component';
import { PrelimSearchComponent } from './prelim-search/prelim-search.component';


const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'cpc', component: CpcComponent },
  { path: 'preliminary-search', component: PrelimSearchComponent },
  { path: 'disclaimer', component: DisclaimerComponent },
  { path: '**', component: HomeComponent},
  { path: '', component: HomeComponent, pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
