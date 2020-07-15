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
      //By default, categorize anything that isn't defined as a noun
      returnArray.push('noun');
    });
    return returnArray;
  }

  createKnowledgeBase(domain: string) {
    this.knowledgeBase = new KnowledgeBase(domain);
    /* Get each atom */
    //Strip out the articles and common terms
    let strippedString = this.knowledgeBase.domain.toLowerCase().replace(/[,]/g, '');
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
    //Define words by their 'first' part of speech, giving preference to any prepositions you find
    //Find relationships by using the prepositions
      //Find all prepositions
      //for each preposition
      //  work your way backward until you get to a verb, preposition, or an article
      //    If a verb is found, from the verb to the preposition is the RELATION
      //    work your way backward from the verb until you get to an article (a, an, the). From the word after the article until the verb is an ATOM.
      //    If an article is found instead, just the preposition is the RELATION, and everything preceding it back to the article is an ATOM.
      //    If you hit a preposition, you've run up against overlapping relations. The original preposition is the RELATION, and everything preceding it back to the other preposition is an ATOM
      //  work your way forward from the preposition until you get to a period or a conjugation of the verb "to be" (is, are)
      //  When you find one of these, everything from the preposition to the ending point (period or is/are) is the second ATOM.
      //  At this point, you have a RELATION, a left ATOM, and a right ATOM. Use these to catalog the relation.
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
