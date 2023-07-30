import { Files, HTML } from "@ca-plant-list/ca-plant-list";
import { Glossary } from "../plants/glossary.js";
import { Jekyll } from "../jekyll.js";

class GlossaryPages {

    #outputDir;
    #entryDir;
    #glossary;

    constructor( outputDir ) {
        this.#outputDir = outputDir;
        this.#entryDir = outputDir + "/g";
        this.#glossary = new Glossary();
    }

    #generateEntryPage( entry ) {
        const front = Jekyll.getFrontMatter( { title: entry.getTermName() } );
        const markdown = entry.getMarkdown();
        Files.write( this.#entryDir + "/" + entry.getTermName() + ".md", front + markdown );
    }

    #generateEntryPages() {
        const entries = this.#glossary.getEntries();
        for ( const entry of entries ) {
            this.#generateEntryPage( entry );
        }
    }

    #generateIncludeFile() {

        const links = [];
        const entries = this.#glossary.getEntries();
        for ( const entry of entries ) {
            links.push( HTML.getLink( "g/" + entry.getHTMLFileName(), entry.getTermName() ) );
        }

        Files.write( this.#outputDir + "/_includes/glossary.html", HTML.arrayToLI( links ), true );

    }

    renderPages() {
        // Make sure output directory exists.
        Files.mkdir( this.#entryDir );

        this.#generateIncludeFile();
        this.#generateEntryPages();
    }

}

export { GlossaryPages };