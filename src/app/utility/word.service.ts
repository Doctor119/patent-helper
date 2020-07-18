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
    let foundPatents: Map<string, string> = new Map();
    for (let term of priorityTerms) {
      let scrapeResults: Map<string, string> = await this.scrapeUSPTO(term);
      for (let kvpair of scrapeResults.entries()) {
        if (foundPatents.size > 9) break;
        foundPatents.set(kvpair[0], kvpair[1]);
      }
      if (foundPatents.size > 9) break;
    }

    //Return the results of the search
    return await new Promise((resolve, reject) => {
      resolve(foundPatents);
      console.log('results generated');
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

  /** Uses a knowledge base to select the search terms that will bring back the best results from the USPTO */
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

    console.log('FIRST ORDER DECOMPOSITIONS ARE LISTED BELOW');
    console.log(relationsPlusAtoms);
    console.log(relations);
    console.log(atoms);
    
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
    //  5) Relations that have the longest length
    let sortedRelations: Array<string> = Array.from(relations.keys());
    sortedRelations = sortedRelations.sort();
    sortedRelations = sortedRelations.reverse();
    for (let rel of sortedRelations) {
      if (returnArray.length > 5) return returnArray;
      returnArray.push(rel);
    }
    //  6) Atoms that have the longest length
    let sortedAtoms: Array<string> = Array.from(atoms.keys());
    sortedAtoms = sortedAtoms.sort();
    sortedAtoms = sortedAtoms.reverse();
    for (let atom of sortedAtoms) {
      if (returnArray.length > 5) return returnArray;
      returnArray.push(atom);
    }

    return returnArray;
  }

  /** Retrieves patent data from the USPTO based on some search terms */
  private async scrapeUSPTO(searchTerm: string, cpc?: string): Promise<Map<string, string>> {
    let returnMap: Map<string, string> = new Map();
    let baseURL: string = 'https://www.patentsview.org/api/patents/query?';
    let queryParameters: string;
    let fields: string = '&f=["patent_number","patent_abstract"]';
    //Construct query parameters based on the search terms
    if (cpc) {
      //TODO
    }
    else {
      queryParameters = 'q={"_text_all":{"patent_abstract":"' + searchTerm + '"}}';
    }

    //Query the USPTO
    return await this.http.get(baseURL + queryParameters + fields)
    .toPromise().then(data => {
      if (data['count'] == 0) {
        console.log('No results found for: ' + searchTerm);
        return returnMap;
      }
      else {
        for (let i = 0; i < data['count']; i++) {
          console.log('Results found for: ' + searchTerm);
          returnMap.set(data['patents'][i]['patent_number'], data['patents'][i]['patent_abstract']);
        }
        return returnMap;
      }
    });
    
  }

  /** Gets the parts of speech of a word, as in, whether it is a noun, verb, etc. */
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