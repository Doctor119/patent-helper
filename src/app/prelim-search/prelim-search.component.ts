import { Component, OnInit } from '@angular/core';
import { WordService } from '../utility/word.service';

@Component({
  selector: 'app-prelim-search',
  templateUrl: './prelim-search.component.html',
  styleUrls: ['./prelim-search.component.scss']
})
export class PrelimSearchComponent implements OnInit {
  wordSearchInProgress: boolean  = false;
  description: string;
  cpc: string;

  constructor(private wordService: WordService) { }

  ngOnInit(): void { }

  onClickSubmit(): void {
    this.wordSearchInProgress = true;
    this.wordService.createKnowledgeBase(this.description);
    this.wordSearchInProgress = false;
  }
}
