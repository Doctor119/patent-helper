export class KnowledgeBase {
   domain: string;
   atoms: Array<FirstOrderAtom>;
   relationships: Array<FirstOrderRelation>;

   constructor(domain: string, partsOfSpeechMap: Map<string, string[]>) {
    this.domain = domain;
    this.atoms = new Array<FirstOrderAtom>();
    this.relationships = new Array<FirstOrderRelation>();

    /***** FIRST-ORDER DECOMPOSITION*****/
    //Define words by the part of speech listed, giving preference to any prepositions you find

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
}

export class FirstOrderRelation {
    relation: string;
    leftAtom: FirstOrderAtom;
    rightAtom: FirstOrderAtom;

    constructor(leftAtom: FirstOrderAtom, relation: string, rightAtom: FirstOrderAtom) {
        this.leftAtom = leftAtom;
        this.relation = relation;
        this.rightAtom = rightAtom;
    }

    /**Gets the individual words of the relation without atoms added. */
    getRelationIndividualWords(): string[] {
        return this.relation.split(' ');
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
