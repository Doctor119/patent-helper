import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { resolveForwardRef } from '@angular/core';
import { getUrlScheme } from '@angular/compiler';
import { of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CpcSearch {
    //A         single letter
    level1 = /^[ABCDEFGHY]$/;

    //A01       single letter, 2 numbers
    level2 = /^[ABCDEFGHY][0-9]{2}$/;

    //A01B      single letter, 2 numbers, single letter
    level3 = /^[ABCDEFGHY][0-9]{2}[A-Z]$/;

    //A01B1/00  single letter, 2 numbers, single letter, 1-4 numbers, slash, two zeros
    level4 = /^[ABCDEFGHY]\d{2}[A-Z]\d{1,4}\/0{2}$/;

    //A01B1/02  single letter, 2 numbers, single letter, 1-4 numbers, slash, at least 2 digits that are not "00" or at least 3 digits
    level5 = /^[ABCDEFGHY]\d{2}[A-Z]\d{1,4}\/(\d{3,}|(?!00)\d{2,})$/;

    headers: HttpHeaders = new HttpHeaders()
        .set('Content-Type', 'text-xml')
        .append('Access-Control-Allow-Methods', 'GET')
        .append('Access-Control-Allow-Origin', '*')
        .append('Access-Control-Allow-Headers', "Access-Control-Allow-Headers, Access-Control-Allow-Origin, Access-Control-Request-Method");

    constructor(private http: HttpClient) { }

    async getBaseTree(): Promise<[string, string][]> {
        return await this.cpcSelection('-');
    }

    /** Uses the selection to intelligently get the list that's "underneath" it */
    async cpcSelection(selection: string): Promise<[string, string][]> {
        if (selection === '-') {
            return [
                ['A', 'HUMAN NECESSITIES'],
                ['B', 'PERFORMING OPERATIONS; TRANSPORTING'],
                ['C', 'CHEMISTRY; METALLURGY'],
                ['D', 'TEXTILES; PAPER'],
                ['E', 'FIXED CONSTRUCTIONS'],
                ['F', 'MECHANICAL ENGINEERING; LIGHTING; HEATING; WEAPONS; BLASTING'],
                ['G', 'PHYSICS'],
                ['H', 'ELECTRICITY'],
                ['Y', 'GENERAL TAGGING OF NEW TECHNOLOGICAL DEVELOPMENTS; GENERAL TAGGING OF CROSS-SECTIONAL TECHNOLOGIES SPANNING OVER SEVERAL SECTIONS OF THE IPC; TECHNICAL SUBJECTS COVERED BY FORMER USPC CROSS-REFERENCE ART COLLECTIONS [XRACs] AND DIGESTS']
            ];
        }
        else {
            //Figure out which level it's on
            let currentLevel: RegExp;
            let oneLevelHigher: RegExp;
            if (this.level1.test(selection)) {
                currentLevel = this.level1;
                oneLevelHigher = this.level2;
            }
            else if (this.level2.test(selection)) {
                currentLevel = this.level2;
                oneLevelHigher = this.level3;
            }
            else if (this.level3.test(selection)) {
                currentLevel = this.level3;
                oneLevelHigher = this.level4;
            }
            else if (this.level4.test(selection)) {
                currentLevel = this.level4;
                oneLevelHigher = this.level5;
            }
            else throw "selection does not match any level";

            //Get the text file
            let fullFileText: string[] = await (await this.getCpcTxtFile(selection[0])).split('\n');

            //Get all the elements that match the regex of one level higher
            let returnArray: [string, string][] = [];

            switch(currentLevel) {
                case this.level1:
                    for (let line of fullFileText) {
                        let splitString: string[] = line.split('\t');
                        if (splitString[0][0] === selection && oneLevelHigher.test(splitString[0])) {
                            returnArray.push([splitString[0], splitString[1]]);
                        }
                    }
                    break;
                case this.level2:
                    for (let line of fullFileText) {
                        let splitString: string[] = line.split('\t');
                        if (splitString[0].startsWith(selection) && oneLevelHigher.test(splitString[0])) {
                            returnArray.push([splitString[0], splitString[1]]);
                        }
                    }
                    break;
                case this.level3:
                    for (let line of fullFileText) {
                        let splitString: string[] = line.split('\t');
                        if (splitString[0].startsWith(selection) && oneLevelHigher.test(splitString[0])) {
                            returnArray.push([splitString[0], splitString[1]]);
                        }
                    }
                    break;
                case this.level4:
                    for (let line of fullFileText) {
                        let splitString: string[] = line.split('\t');
                        if (splitString[0].startsWith(selection.replace('\/00', '\/')) && oneLevelHigher.test(splitString[0])) {
                            returnArray.push([splitString[0], splitString[1]]);
                        }
                    }
                    break;
                default: throw "level not supported: " + this.level1;
            }
            return returnArray;
        }
    }

    private async getCpcTxtFile(cpcSection: string): Promise<string> {
        return await this.http.get('./assets/CPCTitleList202005/cpc-section-' + cpcSection + '_20200501.txt', { responseType: 'text'})
            .toPromise();
    }

    async getUpperCode(code: string): Promise<[string, string]> {
        //Identify the code's current level
        let currentLevel: RegExp;
        if (this.level1.test(code)) currentLevel = this.level1;
        else if (this.level2.test(code)) currentLevel = this.level2;
        else if (this.level3.test(code)) currentLevel = this.level3;
        else if (this.level4.test(code)) currentLevel = this.level4;
        else if (this.level5.test(code)) currentLevel = this.level5;
        else throw "Could not identify code level";
        //Edge case: if the code is level 1, there is no upper code
        if (currentLevel === this.level1) return ['-', '---'];

        //Convert the code into the upper code
        let upperCode: string;
        switch(currentLevel) {
            case this.level2:
                upperCode = code[0];
                break;
            case this.level3:
                upperCode = code.substr(0, 3);
                break;
            case this.level4:
                upperCode = code.substr(0, 4);
                break;
            case this.level5:
                let indexOfSlash = code.indexOf('\/');
                upperCode = code.substr(0, indexOfSlash+1) + '00';
                break;
            default:
                throw "could not identify code level";
        }

        //Find the details of the newly-found upper code
        let fullFileText: string[] = await (await this.getCpcTxtFile(upperCode[0])).split('\n');
        for (let line of fullFileText) {
            let splitLine: string[] = line.split('\t');
            if (splitLine[0] === upperCode)
                return [splitLine[0], splitLine[1]];
        }
    }

    async searchCpcsByKeyword(keyword: string, maxNumOfResults: number): Promise<[string, string][]> {
        let cpcLetters: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'Y'];
        let keywords: string[] = keyword.split(' ');
        let returnArray: [string, string][] = [];
        for (let letter of cpcLetters) {
            let fullText: string = await this.getCpcTxtFile(letter);
            for (let line of fullText.split('\n')) {
                for (let k of keywords) {
                    if (line.includes(k)) {
                        returnArray.push([line.split('\t')[0], line.split('\t')[1]]);
                        if (returnArray.length >= maxNumOfResults) {
                            return returnArray;
                        }
                    }
                }
            }
        }
        return returnArray;
    }
}
