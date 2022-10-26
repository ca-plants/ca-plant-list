import * as fs from "node:fs";
import { HTMLPage } from "./htmlpage.js";
import { HTML, HTML_OPTIONS } from "./html.js";
import { Jepson } from "./jepson.js";
import { Taxa } from "./taxa.js";

class Families {

    static #families;

    static getFamily( familyName ) {
        return this.#families[ familyName ];
    }

    static init( dataDir ) {
        this.#families = JSON.parse( fs.readFileSync( dataDir + "/families.json" ) );
        for ( const [ k, v ] of Object.entries( this.#families ) ) {
            this.#families[ k ] = new Family( k, { id: v } );
        }
    }

    static renderPages( outputDir ) {
        new PageFamilyList( Object.values( this.#families ) ).render( outputDir );

        for ( const family of Object.values( this.#families ) ) {
            if ( family.getTaxa() ) {
                new PageFamily( family ).render( outputDir );
            }
        }
    }

}

class PageFamilyList extends HTMLPage {

    #families;

    constructor( families ) {
        super();
        this.#families = families;
    }

    render( outputDir ) {

        const title = "Families";

        let html = this.getFrontMatter( title );

        html += HTML.getElement( "h1", title );

        html += "<ul>";
        for ( const family of this.#families ) {
            const taxa = family.getTaxa();
            if ( taxa ) {
                const link = HTML.getLink( "./" + family.getFileName(), family.getName() );
                html += "<li>" + link + " (" + taxa.length + ")" + "</li>";
            }
        }
        html += "</ul>";

        this.writeFile( outputDir, "list_families.html", html );
    }
}

class PageFamily extends HTMLPage {

    #family;

    constructor( family ) {
        super();
        this.#family = family;
    }

    render( outputDir ) {

        let html = this.getFrontMatter( this.#family.getName() );

        html += HTML.getElement( "h1", this.#family.getName() );

        html += HTML.getElement(
            "div",
            Jepson.getEFloraLink( this.#family.getJepsonID() ),
            { class: "section" },
            HTML_OPTIONS.NO_ESCAPE
        );

        html += Taxa.getHTMLTable( this.#family.getTaxa() );

        this.writeFile( outputDir, this.#family.getFileName(), html );

    }
}

class Family {

    #name;
    #data;

    constructor( name, data ) {
        this.#name = name;
        this.#data = data;
    }

    addTaxon( taxon ) {
        if ( !this.#data.taxa ) {
            this.#data.taxa = [];
        }
        this.#data.taxa.push( taxon );
    }

    getFileName( ext = "html" ) {
        return this.getName() + "." + ext;
    }

    getJepsonID() {
        return this.#data.id;
    }

    getName() {
        return this.#name;
    }

    getTaxa() {
        return this.#data.taxa;
    }

}

export { Families };