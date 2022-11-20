import { Taxon } from "./taxon.js";
import { ErrorLog } from "./errorlog.js";
import { HTML } from "./html.js";
import { CSV } from "./csv.js";
import { RarePlants } from "./rareplants.js";

const COLUMNS = {
    COL_CESA: "CESA",
    COL_COMMON_NAME: "Common Name",
    COL_CNPS_RANK: "CNPS Rank",
    COL_SPECIES: "Species",
};

const DEFAULT_COLUMNS = [ COLUMNS.COL_SPECIES, COLUMNS.COL_COMMON_NAME ];

class Taxa {

    static #taxa = {};
    static #sortedTaxa;

    static getHTMLTable( taxa, columns = DEFAULT_COLUMNS ) {

        let includeRPI = true;

        let html = "<table><thead>";
        for ( const column of columns ) {
            html += HTML.textElement( "th", column );
            if ( column === COLUMNS.COL_CNPS_RANK ) {
                // Don't show rarity with species link if CNPS Rank column is included.
                includeRPI = false;
            }
        }
        html += "</thead>";
        html += "<tbody>";

        for ( const taxon of taxa ) {
            html += "<tr>";
            for ( const column of columns ) {
                switch ( column ) {
                    case COLUMNS.COL_CESA:
                        html += HTML.textElement( "td", RarePlants.getCESADescription( taxon.getCESA() ) );
                        break;
                    case COLUMNS.COL_COMMON_NAME:
                        html += HTML.textElement( "td", taxon.getCommonNames().join( ", " ) );
                        break;
                    case COLUMNS.COL_CNPS_RANK:
                        html += HTML.wrap( "td", HTML.wrap( "span", taxon.getRPIRankAndThreat(), taxon.getRPIRankAndThreatTooltip( {} ) ) );
                        break;
                    case COLUMNS.COL_SPECIES:
                        html += HTML.wrap( "td", taxon.getHTMLLink( true, includeRPI ) );
                        break;
                }
            }
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
                        row[ "RPI ID" ],
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

export { Taxa, COLUMNS };