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
            if (currentWord === 'is' || currentWord === 'are' || currentWord.endsWith('.')) {
                for (let j = prep+1; j <= i; j++)
                    tempRightAtom.fullAtom += ' ' + splitDomain_periods[j];
                tempRightAtom.fullAtom = tempRightAtom.fullAtom.trim().replace('.', '');
                tempRelation.rightAtom = tempRightAtom;
                break;
            }
        }
        //At this point, you have a RELATION, a left ATOM, and a right ATOM. Use these to catalog the relation.
        this.relations.push(tempRelation);
        if (typeof tempRelation.leftAtom !== 'undefined')
            this.atoms.push(tempRelation.leftAtom);
        this.atoms.push(tempRelation.rightAtom);
    }
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
            return this.relation + ' (' + this.rightAtom.fullAtom + ')';
        else 
            return '(' + this.leftAtom.fullAtom + ') ' + this.relation + ' (' + this.rightAtom.fullAtom + ')';
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
