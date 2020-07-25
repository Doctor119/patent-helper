import { ThrowStmt } from '@angular/compiler';

export class KnowledgeBase {
   domain: string;
   atoms: Array<FirstOrderAtom>;
   relations: Array<FirstOrderRelation>;

   constructor(domain: string, partsOfSpeechMap: Map<string, string[]>) {
    this.domain = domain;
    this.atoms = new Array<FirstOrderAtom>();
    this.relations = new Array<FirstOrderRelation>();

    /***** FIRST-ORDER DECOMPOSITION*****/
    //Define words by the part of speech listed first, giving preference to any prepositions you find
    let indicesOfPrepositions: number[] = [];
    let splitDomain_noperiods: string[] = this.domain.replace(/[.,]/g, '').split(' ');
    let reducedPartsOfSpeechMap: Map<string, string> = new Map();
    for (let i = 0; i < splitDomain_noperiods.length; i++) {
        let partsOfSpeechList: string[] = partsOfSpeechMap.get(splitDomain_noperiods[i].toLowerCase());
        let itsAPreposition: boolean = false;
        for (let pos of partsOfSpeechList) {
            if (pos === 'preposition') {
                itsAPreposition = true;
                break;
            }
        }
        if (itsAPreposition) {
            indicesOfPrepositions.push(i);
            if (!reducedPartsOfSpeechMap.has(splitDomain_noperiods[i].toLowerCase()))
                reducedPartsOfSpeechMap.set(splitDomain_noperiods[i].toLowerCase(), 'preposition');
        }
        else {
            if (!reducedPartsOfSpeechMap.has(splitDomain_noperiods[i].toLowerCase()))
                reducedPartsOfSpeechMap.set(splitDomain_noperiods[i].toLowerCase(), partsOfSpeechList[0]);
        }
    }
    //Find relations by using the prepositions
    let splitDomain_periods: string[] = this.domain.replace(/,/g, '').toLowerCase().split(' ');
    //  For each preposition, construct a relation with atoms.
    for (let prep of indicesOfPrepositions) {
        let tempRelation: FirstOrderRelation = new FirstOrderRelation();
        let tempLeftAtom: FirstOrderAtom = new FirstOrderAtom('');
        let tempRightAtom: FirstOrderAtom = new FirstOrderAtom('');
        tempRelation.relation = "";
        //First, work your way backward until you get to a verb, preposition, or article (this process finds the relation and left atom)
        for (let i = prep-1; i >= 0; i--) {
            let currentWord = splitDomain_periods[i];
            //If a verb is found, the words from the verb to the preposition are the RELATION (including the verb and preposition) and this implies there is NO LEFT ATOM
            if (reducedPartsOfSpeechMap.get(currentWord) === 'verb') {
                //Note: i = index of verb, prep = index of preposition
                for (let j = i; j <= prep; j++) {
                    tempRelation.relation += ' ' + splitDomain_periods[j];
                }
                tempRelation.relation = tempRelation.relation.trim();
                break;
            }
            //If an article is found, just the preposition is the RELATION, and everything preceding it back to the article is the LEFT ATOM (including the article)
            else if (reducedPartsOfSpeechMap.get(currentWord) === 'definite article') {
                //Note: i = index of article, prep = index of preposition
                for (let j = i; j < prep; j++)
                    tempLeftAtom.fullAtom += ' ' + splitDomain_periods[j];
                tempLeftAtom.fullAtom = tempLeftAtom.fullAtom.trim();
                tempRelation.leftAtom = tempLeftAtom;
                tempRelation.relation = splitDomain_periods[prep];
                break;
            }
            /*If a preposition is found, you've run up against overlapping relations. The original preposition is the RELATION, and everything preceding it back to the
            * other preposition is the LEFT ATOM (not including the other preposition) */
            else if (reducedPartsOfSpeechMap.get(currentWord) === 'preposition') {
                //Note: i = index of discovered preposition, prep = index of original preposition
                for (let j = i+1; j < prep; j++) {
                    tempLeftAtom.fullAtom += ' ' + splitDomain_periods[j];
                }
                tempLeftAtom.fullAtom = tempLeftAtom.fullAtom.trim();
                tempRelation.leftAtom = tempLeftAtom;
                tempRelation.relation = splitDomain_periods[prep];
                break;
            }
        }
        //Next, work your way forward until you get to a period or "to be" (this process finds the right atom)
        for (let i = prep+1; i < splitDomain_periods.length; i++) {
            let currentWord = splitDomain_periods[i];
            //When a period or is/are is found, everything from the preposition to this point is the SECOND ATOM (not including the preposition)
            if (currentWord === 'is' || currentWord === 'are' || currentWord === 'have' || currentWord === 'has' || currentWord.endsWith('.')) {
                for (let j = prep+1; j <= i; j++)
                    tempRightAtom.fullAtom += ' ' + splitDomain_periods[j];
                tempRightAtom.fullAtom = tempRightAtom.fullAtom.trim().replace('.', '');
                tempRelation.rightAtom = tempRightAtom;
                break;
            }
        }
        //At this point, you have a RELATION, a left ATOM, and a right ATOM. Use these to catalog the relation.
        this.relations.push(tempRelation);
        if (typeof tempRelation.leftAtom !== 'undefined') {
            this.atoms.push(tempRelation.leftAtom);
        }
        this.atoms.push(tempRelation.rightAtom);
        //Now, get a more fine-tuned experience by splitting the atoms where you encounter 'and' and 'or', and constructing new relations based off those
        //Start with the left atom
        if (typeof tempRelation.leftAtom !== 'undefined') {
            if (/( and | or )/g.test(tempRelation.leftAtom.fullAtom)) {
                //Split the string up into an array of words
                let splitAtom: string[] = tempRelation.leftAtom.fullAtom.split(' ');
                let lastFoundAndOrIndex = -1;
                //Use the and/or words to construct new atoms, starting from the beginning of the array and iterating through until it hits an "and" or "or"
                for (let i = 0; i < splitAtom.length; i++) {
                    if (splitAtom[i] === 'and' || splitAtom[i] === 'or') {
                        let newAtom: string = "";
                        for (let j = lastFoundAndOrIndex + 1; j < i; j++) {
                            newAtom += ' ' + splitAtom[j];
                        }
                        newAtom = newAtom.trim().replace('.', '');
                        let tempAtom: FirstOrderAtom = new FirstOrderAtom(newAtom);
                        let newRelation: FirstOrderRelation = new FirstOrderRelation();
                        newRelation.leftAtom = tempAtom;
                        newRelation.rightAtom = tempRelation.rightAtom;
                        newRelation.relation = tempRelation.relation;
                        this.relations.push(newRelation);
                        this.atoms.push(tempAtom);
                        lastFoundAndOrIndex = i;
                    }
                }
                //After iterating through the whole array, all that will be left is the last atom
                let newAtom: string = "";
                for (let j = lastFoundAndOrIndex + 1; j < splitAtom.length; j++) {
                    newAtom += ' ' + splitAtom[j];
                }
                newAtom = newAtom.trim().replace('.', '');
                let tempAtom: FirstOrderAtom = new FirstOrderAtom(newAtom);
                let newRelation: FirstOrderRelation = new FirstOrderRelation();
                newRelation.leftAtom = tempAtom;
                newRelation.rightAtom = tempRelation.rightAtom;
                newRelation.relation = tempRelation.relation;
                this.relations.push(newRelation);
                this.atoms.push(tempAtom);
            }
            //Expand the fine-tuning by adding atoms to the list that are simple adjective-noun expressions
            let splitAtom: string[] = tempRelation.leftAtom.fullAtom.split(' ');
            let lastFoundNounIndex = -1;
            for (let i = 0; i < splitAtom.length; i++) {
                if (reducedPartsOfSpeechMap.get(splitAtom[i]) === 'noun') {
                    let newAtom: string = "";
                    for (let j = lastFoundNounIndex + 1; j < i; j++) {
                        newAtom += ' ' + splitAtom[j];
                    }
                    newAtom = newAtom.trim().replace('.', '');
                    this.atoms.push(new FirstOrderAtom(newAtom));
                    lastFoundNounIndex = i;
                }
            }
            //Finally, split the atoms into individual words and add them to the list of atoms
            for (let i = 0; i < splitAtom.length; i++) {
                this.atoms.push(new FirstOrderAtom(splitAtom[i].replace('.', '')));
            }
        }
        //Now do the same process with the right atom
        if (/( and | or )/g.test(tempRelation.rightAtom.fullAtom)) {
            //Split the string up into an array of words
            let splitAtom: string[] = tempRelation.rightAtom.fullAtom.split(' ');
            let lastFoundAndOrIndex = -1;
            //Use the and/or words to construct new atoms, starting from the beginning of the array and iterating through until it hits an "and" or "or"
            for (let i = 0; i < splitAtom.length; i++) {
                if (splitAtom[i] === 'and' || splitAtom[i] === 'or') {
                    let newAtom: string = "";
                    for (let j = lastFoundAndOrIndex + 1; j < i; j++) {
                        newAtom += ' ' + splitAtom[j];
                    }
                    newAtom = newAtom.trim().replace('.', '');
                    let tempAtom: FirstOrderAtom = new FirstOrderAtom(newAtom);
                    let newRelation: FirstOrderRelation = new FirstOrderRelation();
                    newRelation.leftAtom = tempRelation.leftAtom;
                    newRelation.rightAtom = tempAtom;
                    newRelation.relation = tempRelation.relation;
                    this.relations.push(newRelation);
                    this.atoms.push(tempAtom);
                    lastFoundAndOrIndex = i;
                }
            }
            //After iterating through the whole array, all that will be left is the last atom
            let newAtom: string = "";
            for (let j = lastFoundAndOrIndex + 1; j < splitAtom.length; j++) {
                newAtom += ' ' + splitAtom[j];
            }
            newAtom = newAtom.trim().replace('.', '');
            let tempAtom: FirstOrderAtom = new FirstOrderAtom(newAtom);
            let newRelation: FirstOrderRelation = new FirstOrderRelation();
            newRelation.leftAtom = tempRelation.leftAtom;
            newRelation.rightAtom = tempAtom;
            newRelation.relation = tempRelation.relation;
            this.relations.push(newRelation);
            this.atoms.push(tempAtom);
        }
        //Expand the fine-tuning by adding atoms to the list that are simple adjective-noun expressions
        let splitAtom: string[] = tempRelation.rightAtom.fullAtom.split(' ');
        let lastFoundNounIndex = -1;
        for (let i = 0; i < splitAtom.length; i++) {
            if (reducedPartsOfSpeechMap.get(splitAtom[i]) === 'noun') {
                let newAtom: string = "";
                for (let j = lastFoundNounIndex + 1; j < i; j++) {
                    newAtom += ' ' + splitAtom[j];
                }
                newAtom = newAtom.trim().replace('.', '');
                this.atoms.push(new FirstOrderAtom(newAtom));
                lastFoundNounIndex = i;
            }
        }
        //Finally, split the atoms into individual words and add them to the list of atoms
        for (let i = 0; i < splitAtom.length; i++) {
            this.atoms.push(new FirstOrderAtom(splitAtom[i].replace('.', '')));
        }
    }
    //Once construction is complete, take out any atoms which are empty strings
    this.atoms = this.atoms.filter(atm => atm.fullAtom !== '');
   }
}

export class FirstOrderRelation {
    relation: string;
    leftAtom: FirstOrderAtom;
    rightAtom: FirstOrderAtom; 

    constructor() { }

    /**Gets the individual words of the relation without atoms added. */
    getRelationIndividualWords(): string[] {
        return this.relation.split(' ');
    }

    toString(): string {
        if (typeof this.leftAtom === 'undefined')
            return this.relation + ' ' + this.rightAtom.fullAtom;
        else 
            return this.leftAtom.fullAtom + ' ' + this.relation + ' ' + this.rightAtom.fullAtom;
    }
}

export class FirstOrderAtom {
    fullAtom: string;

    constructor(atom: string) {
        this.fullAtom = atom;
    }

    /**Gets the individual words of the atom */
    getIndividualWords(): string[] {
        return this.fullAtom.split(' ');
    }
}
