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

  constructor(private http: HttpClient, private config: ConfigService) {
    this.wordAPIRootUrl = "https://wordsapiv1.p.rapidapi.com/words/";

    this.headers = new HttpHeaders()
    .set("x-rapidapi-host", "wordsapiv1.p.rapidapi.com")
    .set("x-rapidapi-key", config.rapidApiKey);
  }

  /** Using the inventor's description, decomposes the description into first-order relationships, then uses those relationships
   * to form a priority list of terms to search in the USPTO database. Returns a map containing patent numbers and a portion of their
   * abstracts.
   */
  public async getSearchResults(description: string) : Promise<Map<string, string>>{
    //First, use a dictionary API to retrieve the types of speech of each word (noun, verb, preposition, etc.)
    let wordsOfSpeechMap: Map<string, string[]> = await this.getPartsOfSpeechMap(description);

    //Using these retrieved types of speech, create a knowledge base out of them.
    //This KnowledgeBase object intelligently constructs atoms and relations.
    let knowledgeBase = new KnowledgeBase(description, await wordsOfSpeechMap);

    //Using the knowledge base, create a list of priority search terms
    let priorityTerms: string[] = this.getPrioritySearchTerms(knowledgeBase);

    //Go scrape the USPTO databases using the search terms
    let scrapeResults: Map<string, string> = await this.scrapeUSPTO(priorityTerms);

    //Return the results of the search
    return await new Promise((resolve, reject) => {
      setTimeout(() => {
        let returnMap: Map<string, string> = new Map();
        returnMap.set('1234567890', 'This is a sample invention abstract.');
        returnMap.set('0987654321', 'This is a second invention abstract');
        returnMap.set('123579111317', 'This is a third patent abstract');
        resolve(returnMap);
        console.log('results generated');
      }, 2000);
    });
  }

  private async getPartsOfSpeechMap(domain: string): Promise<Map<string, string[]>> {
    let strippedDomain: string[] = domain.toLowerCase().replace(/[.,]/g, '').split(' ');
    let domainSet: Set<string> = new Set(strippedDomain);
    let returnMap: Map<string, string[]> = new Map();
    for (let word of domainSet) {
      returnMap.set(word, await this.getWordTypes(word));
    }
    return await new Promise<Map<string, string[]>>((resolve) => {
      resolve(returnMap);
    });
  }

  private getPrioritySearchTerms(kb: KnowledgeBase): string[] {
    //Once all relations and atoms are catalogued, rank them by how commonly they occur, and use that to form a list of priorities for the search.
      //  1) Multiples of relations and atoms
      //  2) Multiples of relations
      //  3) Multiples of atoms
      //  4) relations/atoms that have the longest length
      //  5) relations/atoms that include the words "invention" or "present invention" are lowest priority
    return [];
  }

  private async scrapeUSPTO(searchTerms: string[], cpc?: string): Promise<Map<string, string>> {
    return new Promise<Map<string, string>>((resolve) => {
      resolve(new Map<string, string>());
    });
  }

  private async getWordTypes(word: string): Promise<string[]> {
    let returnArray: string[] = [];
    let resultSet: Set<string> = new Set();
    return await this.http.get(this.wordAPIRootUrl+word, {headers: this.headers})
      .toPromise().then(data => {
        if (word === 'a' || word === 'an' || word === 'the')
          returnArray.push('definite article');
        else {
          for (let i = 0; i < data['results'].length; i++) {
            resultSet.add(data['results'][i]['partOfSpeech']);
          }
          for (let r of resultSet.values()) {
            if (r == null) continue;
            returnArray.push(r);
          }
        }
        return returnArray;
      })
      .catch(error => {
        //Apparently there are a bunch of common words not in the dictionary, so I have to hack this
        if (word === 'is' || word === 'are')
          returnArray.push('verb');
        else if (word.endsWith('ed') || word === 'its')
          returnArray.push('adjective');
        else {
          //By default, categorize anything with no definition as a noun
          returnArray.push('noun');
        }
        return returnArray;
      });
  }
}

/*
private async getWordTypes(word: string) : string[] {
    let returnArray : string[] = [];
    let resultSet = new Set<string>();

    let results = this.http.get(this.wordAPIRootUrl+word.replace('.', ''), {headers: this.headers} )
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
    //Strip out the articles and common terms
    let strippedString = domain.toLowerCase();
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
*/