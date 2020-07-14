export class KnowledgeBase {
    /*
        Build a knowledge base out of the description, then analyze the metadata about that knowledge base to extract search terms out of it.
        Once search terms have been extracted, use them to query the abstracts of patents.
        The main process:
            -Break down the description into first-order atoms and relationships
                -These relationships will take the form of functions. If the inventor specifies that corn passes through a hopper, the function will be PASS_THROUGH(corn, hopper)
            -Count up each atom
            -Count up each relationship
            -Use these counts to establish a priority for which terms to search
            -Go out to the application and patent databases, searching for terms. Search using the abstract, and optionally with the CPC code
            -Scrape what comes up from the first page of results

        The DOMAIN is the description the inventor enters
        Adjectives, verbs ("they are", "it processes"), and prepositions ("of", "under") are RELATIONs (a set of tuples of objects that are related),
        and should be made into functions.
        Turn nouns into OBJECTS
    */

   domain: string;
   atoms: Array<string>;
   relationships: Array<string>;

   constructor(domain: string) {
    this.domain = domain;
    this.atoms = new Array<string>();
    this.relationships = new Array<string>();
   }
}
