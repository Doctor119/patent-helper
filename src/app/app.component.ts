import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public constructor(private titleService: Title) {
    this.titleService.setTitle("Preliminary Patent Search");
  }
  title = 'patent-helper';

  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle)
  }
}
