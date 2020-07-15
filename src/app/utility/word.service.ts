import { Injectable, resolveForwardRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { VirtualTimeScheduler, Observable } from 'rxjs';
import { KnowledgeBase, FirstOrderAtom, FirstOrderRelation } from './knowledge-base';
import { ConfigService } from './config.service'; 

@Injectable({
  providedIn: 'root'
})
export class WordService {
  private readonly wordAPIRootUrl: string;
  private readonly headers: HttpHeaders;
  private knowledgeBase: KnowledgeBase;

  constructor(private http: HttpClient, private config: ConfigService) {
    this.wordAPIRootUrl = "https://wordsapiv1.p.rapidapi.com/words/";

    this.headers = new HttpHeaders()
    .set("x-rapidapi-host", "wordsapiv1.p.rapidapi.com")
    .set("x-rapidapi-key", config.rapidApiKey);
  }

  private getWordTypes(word: string) : string[] {
    let returnArray : string[] = [];
    let resultSet = new Set<string>();
    let results = this.http.get(this.wordAPIRootUrl+word, {headers: this.headers} )
    .toPromise().then(data => {
      for (let i = 0; i < data['results'].length; i++) {
        resultSet.add(data['results'][i]['partOfSpeech']);
      }
      for (let r of resultSet.values()) {
        if (r == null) continue;
        returnArray.push(r);
      }
    })
    .catch(error => {
      //By default, categorize anything with no definition as a noun
      returnArray.push('noun');
    });
    return returnArray;
  }

  createKnowledgeBase(domain: string) {
    /* Get each atom */
    //Strip out the articles and common terms
    let strippedString = domain.toLowerCase().replace(/[,]/g, '');
    let strippedDomain: Array<string> = strippedString.split(' ');
    //Go get the parts of speech of each word (while minimizing the number of calls to WordsAPI)
    let domainSet: Set<string> = new Set<string>();
    for (let i = 0; i < strippedDomain.length; i++) {
      domainSet.add(strippedDomain[i]);
    }
    let identifiedPartsOfSpeech: Map<string, string[]> = new Map();
    domainSet.forEach(word => {
      identifiedPartsOfSpeech.set(word, this.getWordTypes(word));
    });
    //Construct the knowledge base
    this.knowledgeBase = new KnowledgeBase(domain, identifiedPartsOfSpeech);
  }

  getTopPrioritySearchTerms(): string[] {
    //Once all relations and atoms are catalogued, rank them by how commonly they occur, and use that to form a list of priorities for the search.
      //  1) Multiples of relations and atoms
      //  2) Multiples of relations
      //  3) Multiples of atoms
      //  4) relations/atoms that have the longest length
      //  5) relations/atoms that include the words "invention" or "present invention" are lowest priority
      return [];
  }
}
