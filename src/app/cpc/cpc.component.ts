import { Component, OnInit } from '@angular/core';
import { CpcSearch } from '../utility/cpc-search';

@Component({
  selector: 'app-cpc',
  templateUrl: './cpc.component.html',
  styleUrls: ['./cpc.component.scss']
})
export class CpcComponent implements OnInit {
  cpcSearchOption: string = 'none';
  displayTreeSearch: boolean = false;
  displayKeywordSearch: boolean = false;

  upwardTreeSelection: [string, string];
  currentTree: [string, string][];
  currentLevel: number;

  searchInput: string;
  searchResults: [string, string][];

  constructor(private cpcSearch: CpcSearch) {
    this.upwardTreeSelection = ['-', '---'];
    cpcSearch.getBaseTree().then(data => {
      this.currentTree = data;
    });
    this.currentLevel = 1;
  }

  ngOnInit(): void { }

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

  goDownALevel(selectedCode: [string, string]) {
    if(this.currentLevel == 5) return;
    this.currentLevel++;
    this.cpcSearch.cpcSelection(selectedCode[0]).then(data => {this.currentTree = data;} );
    this.upwardTreeSelection = selectedCode;
  }

  goUpALevel(selectedCode: [string, string]) {
    if(this.currentLevel == 1) return;
    this.currentLevel--;
    this.cpcSearch.getUpperCode(selectedCode[0]).then(upperCode => {
      this.cpcSearch.cpcSelection(upperCode[0]).then(data => {this.currentTree = data;} );
      this.upwardTreeSelection = upperCode;
    });
  }

  returnToTop() {
    this.upwardTreeSelection = ['-', '---'];
    this.cpcSearch.getBaseTree().then(data => {
      this.currentTree = data;
    });
    this.currentLevel = 1;
  }

  searchByKeyword() {
    if (typeof this.searchInput === 'undefined') return;
    this.cpcSearch.searchCpcsByKeyword(this.searchInput, 10).then(data => this.searchResults = data);
  }
}
