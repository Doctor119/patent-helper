import { Component, OnInit } from '@angular/core';
import { WordService } from '../utility/word.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-prelim-search',
  templateUrl: './prelim-search.component.html',
  styleUrls: ['./prelim-search.component.scss']
})
export class PrelimSearchComponent implements OnInit {
  wordSearchInProgress: boolean  = false;

  constructor(private wordService: WordService) { }

  ngOnInit(): void { }

}
