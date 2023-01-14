import { Taxon } from "./taxon.js";
import { ErrorLog } from "./errorlog.js";
import { HTML } from "./html.js";
import { CSV } from "./csv.js";
import { RarePlants } from "./rareplants.js";
import { Exceptions } from "./exceptions.js";

const TAXA_LIST_COLS = {
    CESA: {
        title: "California",
        data: ( t ) => RarePlants.getCESADescription( t.getCESA() )
    },
    COMMON_NAME: {
        title: "Common Name",
        data: ( t ) => t.getCommonNames().join( ", " )
    },
    CNPS_RANK: {
        title: "CNPS Rank",
        data: ( t ) => HTML.getToolTip( HTML.textElement( "span", t.getRPIRankAndThreat() ), t.getRPIRankAndThreatTooltip() )
    },
    FESA: {
        title: "Federal",
        data: ( t ) => RarePlants.getFESADescription( t.getFESA() )
    },
    SPECIES: {
        title: "Species",
        data: ( t ) => t.getHTMLLink( true, true )
    },
    SPECIES_BARE: {
        title: "Species",
        data: ( t ) => t.getHTMLLink( true, false )
    },
};

const DEFAULT_COLUMNS = [ TAXA_LIST_COLS.SPECIES, TAXA_LIST_COLS.COMMON_NAME ];

class Taxa {

    static #taxa = {};
    static #sortedTaxa;

    static getHTMLTable( taxa, columns = DEFAULT_COLUMNS ) {

        let html = "<table><thead>";
        for ( const col of columns ) {
            const className = col.class;
            const atts = className ? { class: className } : {};
            html += HTML.textElement( "th", col.title, atts );
        }
        html += "</thead>";
        html += "<tbody>";

        for ( const taxon of taxa ) {
            html += "<tr>";
            for ( const col of columns ) {
                const data = col.data( taxon );
                const className = col.class;
                const atts = className ? { class: className } : {};
                html += HTML.wrap( "td", data, atts );
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
                        row[ "CESA" ],
                        row[ "FESA" ]
                    );
                    if ( !jepsonID && !Exceptions.hasException( name, "jepson", "badjepsonid" ) ) {
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

export { Taxa, TAXA_LIST_COLS };