import * as fs from "node:fs";

import { EBookPage } from "./ebookpage.js";
import { XHTML } from "./xhtml.js";

import { HTML } from "../html.js";
import { Markdown } from "../markdown.js";
import { EBook } from "./ebook.js";

import { Glossary } from "../plants/glossary.js";

class GlossaryPages {

    #glossary;

    constructor() {
        this.#glossary = new Glossary();
    }

    createPages( contentDir ) {

        const termList = [];

        // Create target directory.
        const dirTarget = contentDir + "/g";
        fs.mkdirSync( dirTarget, { recursive: true } );

        for ( const entry of this.#glossary.getEntries() ) {

            new PageGlossaryEntry( contentDir, entry ).create();

            // Add term to index page list.
            termList.push( HTML.getLink( "g/" + entry.getHTMLFileName, entry.getTermName() ) );

        }

        // Write glossary index page.
        new PageGlossary( contentDir, termList ).create();
    }

    getManifestEntries() {

        const glossaryEntries = this.#glossary.getEntries();
        const manifestEntries = [];

        manifestEntries.push( EBook.getManifestEntry( "g", "glossary.html" ) );
        for ( let index = 0; index < glossaryEntries.length; index++ ) {
            const entry = glossaryEntries[ index ];
            manifestEntries.push( EBook.getManifestEntry( "g" + index, "g/" + entry.getHTMLFileName() ) );
        }

        return manifestEntries.join( "" );
    }

    getSpineEntries() {

        const glossaryEntries = this.#glossary.getEntries();
        const spineEntries = [];

        spineEntries.push( EBook.getSpineEntry( "g", "glossary.html" ) );
        for ( let index = 0; index < glossaryEntries.length; index++ ) {
            spineEntries.push( EBook.getSpineEntry( "g" + index ) );
        }

        return spineEntries.join( "" );

    }

}

class PageGlossary extends EBookPage {

    #entries;

    constructor( outputDir, entries ) {
        super( outputDir + "/glossary.html", "Glossary" );
        this.#entries = entries;
    }

    renderPageBody() {
        const html = XHTML.textElement( "h1", this.getTitle() );
        return html + XHTML.wrap( "ol", XHTML.arrayToLI( this.#entries ) );
    }
}

class PageGlossaryEntry extends EBookPage {

    #entry;

    constructor( outputDir, entry ) {
        super( outputDir + "/g/" + entry.getHTMLFileName(), entry.getTermName(), "../" );
        this.#entry = entry;
    }

    renderPageBody() {
        const html = XHTML.textElement( "h1", this.getTitle() );
        return html + Markdown.strToHTML( this.#entry.getMarkdown() );
    }
}

export { GlossaryPages };