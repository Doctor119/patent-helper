import { Injectable, resolveForwardRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { VirtualTimeScheduler, Observable } from 'rxjs';
import { KnowledgeBase } from './knowledge-base';

@Injectable({
  providedIn: 'root'
})
export class WordService {
  private readonly wordAPIRootUrl: string = "https://wordsapiv1.p.rapidapi.com/words/";
  private readonly headers: HttpHeaders = new HttpHeaders()
    .set("x-rapidapi-host", "wordsapiv1.p.rapidapi.com")
    .set("x-rapidapi-key", "7331809e54msh4d7a1172493cf9ep1e1e1ejsne49e84f8814e");
  knowledgeBase: KnowledgeBase;

  constructor(private http: HttpClient) { }

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
      returnArray.push('nodefinition');
    });
    return returnArray;
  }

  createKnowledgeBase(domain: string) {
    this.knowledgeBase = new KnowledgeBase(domain);
    /* Get each atom */
    //Strip out the articles and common terms
    let strippedString = this.knowledgeBase.domain.toLowerCase().replace(/[.,]/g, '');
    strippedString = strippedString.replace('present invention', '').replace('  ', ' ');
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
    //Find relationships by using the prepositions
    //Find atoms by using 'the', 'a', and 'an'
  }
}
