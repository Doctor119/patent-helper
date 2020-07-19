import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cpc',
  templateUrl: './cpc.component.html',
  styleUrls: ['./cpc.component.scss']
})
export class CpcComponent implements OnInit {
  cpcSearchOption: string = 'none';
  displayTreeSearch: boolean = false;
  displayKeywordSearch: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  onItemChange(newValue: string): void {
    if (newValue === 'searchTree') {
      this.displayKeywordSearch = false;
      this.displayTreeSearch = true;
    }
    else if (newValue === 'searchKeyword') {
      this.displayKeywordSearch = true;
      this.displayTreeSearch = false;
    }
  }

  goDownALevel(newLevel: string) {

  }

  goUpALevel(newLevel: string) {
    
  }
}
