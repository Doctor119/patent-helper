import { Injectable, resolveForwardRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { VirtualTimeScheduler, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WordService {
  readonly wordAPIRootUrl: string = "https://wordsapiv1.p.rapidapi.com/words/";
  readonly headers: HttpHeaders = new HttpHeaders()
    .set("x-rapidapi-host", "wordsapiv1.p.rapidapi.com")
    .set("x-rapidapi-key", "7331809e54msh4d7a1172493cf9ep1e1e1ejsne49e84f8814e");

  results: Observable<any>;

  constructor(private http: HttpClient) { }

  getWordDef(word: string) : Observable<string>{
    this.results = this.http.get<Observable<string>>(this.wordAPIRootUrl+word, {headers: this.headers} );
    return this.results;
  }

  getWordTypes(word: string) : string[] {
    let returnArray : string[] = [];
    let resultSet = new Set<string>();
    let results = this.http.get(this.wordAPIRootUrl+word, {headers: this.headers} )
    .toPromise().then(data => {
      for (let i = 0; i < data['results'].length; i++) {
        resultSet.add(data['results'][i]['partOfSpeech']);
      }
      console.log('size of resultSet: ' + resultSet.size);
      for (let r of resultSet.values()) {
        if (r == null) continue;
        returnArray.push(r);
      }
    });
    console.log('size of returnArray: ' + returnArray.length)
    return returnArray;
  }
}
