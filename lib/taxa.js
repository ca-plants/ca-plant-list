import { Taxon } from "./taxon.js";
import { ErrorLog } from "./errorlog.js";
import { HTML, HTML_OPTIONS } from "./html.js";
import { CSV } from "./csv.js";

class Taxa {

    static #taxa = {};
    static #sortedTaxa;

    static getHTMLTable( taxa ) {
        let html = "<table><thead>";
        html += HTML.getElement( "th", "Species" );
        html += HTML.getElement( "th", "Common Name" );
        html += "</thead>";
        html += "<tbody>";

        for ( const taxon of taxa ) {
            html += "<tr>";
            html += HTML.getElement(
                "td",
                taxon.getHTMLLink(),
                undefined,
                HTML_OPTIONS.NO_ESCAPE
            );
            html += HTML.getElement( "td", taxon.getCommonNames().join( ", " ) );
            html += "</tr>";
        }

        html += "</tbody>";
        html += "</table>";

        return html;
    }

    static getTaxa() {
        return this.#sortedTaxa;
    }

    static getTaxon( name ) {
        return this.#taxa[ name ];
    }

    static init( dataDir ) {
        const taxaCSV = CSV.parseFile( dataDir, "taxa.csv" );
        for ( const row of taxaCSV ) {
            const name = row[ "taxon" ];
            const status = row[ "status" ];
            const jepsonID = row[ "jepson id" ];
            switch ( status ) {
                case "N":
                case "NC":
                case "X": {
                    if ( this.#taxa[ name ] ) {
                        ErrorLog.log( name, "has multiple entries" );
                    }
                    const commonName = row[ "common name" ];
                    this.#taxa[ name ] = new Taxon(
                        name,
                        commonName,
                        status,
                        jepsonID,
                        row[ "calrecnum" ],
                        row[ "inat id" ],
                        row[ "CRPR" ],
                        row[ "CESA" ]
                    );
                    if ( !jepsonID ) {
                        ErrorLog.log( name, "has no Jepson ID" );
                    }
                    break;
                }
                default:
                    ErrorLog.log( name, "has unrecognized status", status );
            }
        }

        this.#sortedTaxa = Object.values( this.#taxa ).sort( ( a, b ) => a.getName().localeCompare( b.getName() ) );

        const synCSV = CSV.parseFile( dataDir, "synonyms.csv" );
        for ( const syn of synCSV ) {
            const currName = syn[ "Current" ];
            const taxon = this.getTaxon( currName );
            if ( !taxon ) {
                ErrorLog.log( currName, "has synonym but not in taxa.csv" );
                continue;
            }
            taxon.addSynonym( syn[ "Former" ], syn[ "Type" ] );
        }

    }

}

export { Taxa };