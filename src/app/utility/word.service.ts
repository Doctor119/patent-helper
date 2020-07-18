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
    //let wordsOfSpeechMap: Map<string, string[]> = await this.getPartsOfSpeechMap(description);

    //Using these retrieved types of speech, create a knowledge base out of them.
    //This KnowledgeBase object intelligently constructs atoms and relations.
    //let knowledgeBase = new KnowledgeBase(description, await wordsOfSpeechMap);

    //Using the knowledge base, create a list of priority search terms
    //let priorityTerms: string[] = this.getPrioritySearchTerms(knowledgeBase);

    //Go scrape the USPTO databases using the search terms
    let scrapeResults: Map<string, string> = await this.scrapeUSPTO(['terms']);

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
    //Get all the relations + atoms, relations, atoms, and individual words, all set as strings
    let relationsPlusAtoms: Map<string, number> = new Map();
    let relations: Map<string, number> = new Map();
    let atoms: Map<string, number> = new Map();
    let individualWords: Map<string, number> = new Map();
    for (let rel of kb.relations) {
      //Update relations+atoms
      if (relationsPlusAtoms.has(rel.toString())) {
        relationsPlusAtoms.set(rel.toString(), relationsPlusAtoms.get(rel.toString()) + 1);
      }
      else {
        relationsPlusAtoms.set(rel.toString(), 1);
      }
      //Update relations
      if (relations.has(rel.relation)) {
        relations.set(rel.relation, relations.get(rel.relation) + 1);
      }
      else {
        relations.set(rel.relation, 1);
      }
      //Update atoms
      if (typeof rel.leftAtom !== 'undefined') {
        if (atoms.has(rel.leftAtom.fullAtom)) {
          atoms.set(rel.leftAtom.fullAtom, atoms.get(rel.leftAtom.fullAtom) + 1);
        }
        else {
          atoms.set(rel.leftAtom.fullAtom, 1);
        }
      }
      if (atoms.has(rel.rightAtom.fullAtom)) {
        atoms.set(rel.rightAtom.fullAtom, atoms.get(rel.rightAtom.fullAtom) + 1);
      }
      else {
        atoms.set(rel.rightAtom.fullAtom, 1);
      }
      //Update individual words
      if (typeof rel.leftAtom !== 'undefined') {
        for (let word of rel.leftAtom.getIndividualWords()) {
          if (individualWords.has(word)) {
            individualWords.set(word, individualWords.get(word) + 1);
          }
          else {
            individualWords.set(word, 1);
          }
        }
      }
      for (let word of rel.rightAtom.getIndividualWords()) {
        if (individualWords.has(word)) {
          individualWords.set(word, individualWords.get(word) + 1);
        }
        else {
          individualWords.set(word, 1);
        }
      }
      for (let word of rel.getRelationIndividualWords()) {
        if (individualWords.has(word)) {
          individualWords.set(word, individualWords.get(word) + 1);
        }
        else {
          individualWords.set(word, 1);
        }
      }
    }
    
    let returnArray: string[] = [];
    //Use the following priorities
    //  1) Multiples of relations and atoms
    for (let rel of relationsPlusAtoms.keys()) {
      if (returnArray.length > 5) return returnArray;
      if (relationsPlusAtoms.get(rel) > 1)
        returnArray.push(rel);
    }
    //  2) Multiples of relations
    for (let rel of relations.keys()) {
      if (returnArray.length > 5) return returnArray;
      if (relations.get(rel) > 1)
        returnArray.push(rel);
    }
    //  3) Multiples of atoms
    for (let atom of atoms.keys()) {
      if (returnArray.length > 5) return returnArray;
      if (atoms.get(atom) > 1)
        returnArray.push(atom);
    }
    //  4) relations/atoms that have the longest length
    let sortedRelationsAtoms: Array<string> = Array.from(relationsPlusAtoms.keys());
    sortedRelationsAtoms = sortedRelationsAtoms.sort();
    sortedRelationsAtoms = sortedRelationsAtoms.reverse();
    for (let relatoms of sortedRelationsAtoms) {
      if (returnArray.length > 5) return returnArray;
      returnArray.push(relatoms);
    }

    return returnArray;
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