import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { WordService } from '../utility/word.service';

@Component({
  selector: 'app-prelim-search',
  templateUrl: './prelim-search.component.html',
  styleUrls: ['./prelim-search.component.scss']
})
export class PrelimSearchComponent implements OnInit {
  wordSearchInProgress: boolean = false;
  inProgressMessage: string;
  searchResults: Map<string, string> = new Map();
  searchResultsKeys: string[] = [];

  description: string;
  cpc: string;

  constructor(private wordService: WordService) { }

  ngOnInit(): void { }

  onClickSubmit(): void {
    if (typeof this.description === 'undefined') return;
    if (typeof this.cpc !== 'undefined' && !/^[ABCDEFGHY]\d{2}[A-Z]\d{1,4}\/(\d{3,}|(?!00)\d{2,})$/.test(this.cpc)) return;
    this.wordSearchInProgress = true;
    this.inProgressMessage = "querying USPTO database...";
    this.wordService.getSearchResults(this.description, this.cpc.replace(' ', ''))
      .then(data => {
        this.searchResults = data;
        this.searchResultsKeys = Array.from(data.keys());
        this.inProgressMessage = "";
        this.wordSearchInProgress = false;
      });
  }
}
