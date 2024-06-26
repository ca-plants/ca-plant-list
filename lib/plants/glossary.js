import { Config, Files } from "@ca-plant-list/ca-plant-list";

class Glossary {

    #srcPath;
    #srcEntries = [];

    constructor() {

        this.#srcPath = Config.getPackageDir() + "/data/glossary";

        // Find all entries in the glossary directory.
        const entries = Files.getDirEntries( this.#srcPath ).sort();
        for ( const entry of entries ) {
            this.#srcEntries.push( new GlossaryEntry( this.#srcPath, entry ) );
        }

    }

    getEntries() {
        return this.#srcEntries;
    }

}

class GlossaryEntry {

    #srcPath;
    #fileName;
    #term;

    constructor( srcPath, fileName ) {
        this.#srcPath = srcPath;
        this.#fileName = fileName;
        this.#term = fileName.split( "." )[ 0 ];
    }

    getHTMLFileName() {
        return this.#term + ".html";
    }

    getMarkdown() {
        return Files.read( this.#srcPath + "/" + this.#fileName );
    }

    getTermName() {
        return this.#term;
    }

}

export { Glossary };