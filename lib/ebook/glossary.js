import * as fs from "node:fs";

import { EBookPage } from "./ebookpage.js";
import { XHTML } from "./xhtml.js";

import { Config } from "../config.js";
import { Files } from "../files.js";
import { HTML } from "../html.js";
import { Markdown } from "../markdown.js";
import { EBook } from "./ebook.js";

class Glossary {

    #srcPath;
    #srcEntries;

    constructor() {

        this.#srcPath = Config.getPackageDir() + "/data/glossary";

        // Find all entries in the glossary directory.
        this.#srcEntries = Files.getDirEntries( this.#srcPath ).sort();

    }

    createPages( contentDir ) {

        const termList = [];

        // Create target directory.
        const dirTarget = contentDir + "/g";
        fs.mkdirSync( dirTarget, { recursive: true } );

        for ( const fileName of this.#srcEntries ) {

            const term = fileName.split( "." )[ 0 ];

            new PageGlossaryEntry( contentDir, this.#srcPath, term ).create();

            // Add term to index page list.
            termList.push( HTML.getLink( "g/" + term + ".html", term ) );

        }

        // Write glossary index page.
        new PageGlossary( contentDir, termList ).create();
    }

    getManifestEntries() {
        const entries = [];

        entries.push( EBook.getManifestEntry( "g", "glossary.html" ) );
        for ( let index = 0; index < this.#srcEntries.length; index++ ) {
            const term = this.#srcEntries[ index ].split( "." )[ 0 ];
            entries.push( EBook.getManifestEntry( "g" + index, "g/" + term + ".html" ) );
        }

        return entries.join( "" );
    }

    getSpineEntries() {
        const entries = [];

        entries.push( EBook.getSpineEntry( "g", "glossary.html" ) );
        for ( let index = 0; index < this.#srcEntries.length; index++ ) {
            entries.push( EBook.getSpineEntry( "g" + index ) );
        }

        return entries.join( "" );

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

    #srcPath;
    #term;

    constructor( outputDir, srcPath, term ) {
        super( outputDir + "/g/" + term + ".html", term, "../" );
        this.#srcPath = srcPath;
        this.#term = term;
    }

    renderPageBody() {
        const html = XHTML.textElement( "h1", this.getTitle() );
        return html + Markdown.fileToHTML( this.#srcPath + "/" + this.#term + ".md" );
    }
}

export { Glossary };