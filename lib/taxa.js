import { Config } from "./config.js";
import { Taxon } from "./taxon.js";
import { ErrorLog } from "./errorlog.js";
import { HTML } from "./html.js";
import { CSV } from "./csv.js";
import { RarePlants } from "./rareplants.js";

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

    static init( inclusionList, taxaMeta = {}, taxonClass = Taxon, extraTaxa = [], extraSynonyms = [] ) {

        const dataDir = Config.getPackageDir() + "/data";

        const taxaCSV = CSV.parseFile( dataDir, "taxa.csv" );
        this.#loadTaxa( taxaCSV, inclusionList, taxaMeta, taxonClass );
        this.#loadTaxa( extraTaxa, inclusionList, taxaMeta, taxonClass );

        // Make sure everything in the inclusionList has been loaded.
        for ( const name of Object.keys( inclusionList ) ) {
            if ( !this.getTaxon( name ) ) {
                ErrorLog.log( name, "not found in taxon list" );
            }
        }

        this.#sortedTaxa = Object.values( this.#taxa ).sort( ( a, b ) => a.getName().localeCompare( b.getName() ) );

        const synCSV = CSV.parseFile( dataDir, "synonyms.csv" );
        this.#loadSyns( synCSV, inclusionList );
        this.#loadSyns( extraSynonyms, inclusionList );

    }

    static #loadSyns( synCSV, inclusionList ) {
        for ( const syn of synCSV ) {
            const currName = syn[ "Current" ];
            const taxon = this.getTaxon( currName );
            if ( !taxon ) {
                if ( inclusionList === true ) {
                    // If including all taxa, note the error.
                    console.log( "synonym target not found: " + currName );
                }
                continue;
            }
            taxon.addSynonym( syn[ "Former" ], syn[ "Type" ] );
        }
    }

    static #loadTaxa( taxaCSV, inclusionList, taxaMeta, taxonClass ) {
        for ( const row of taxaCSV ) {

            const name = row[ "taxon_name" ];

            let taxon_overrides = {};
            if ( inclusionList !== true ) {
                taxon_overrides = inclusionList[ name ];
                if ( !taxon_overrides ) {
                    continue;
                }
            }

            if ( this.#taxa[ name ] ) {
                ErrorLog.log( name, "has multiple entries" );
            }

            const status = taxon_overrides[ "status" ];
            if ( status !== undefined ) {
                row[ "status" ] = status;
            }
            this.#taxa[ name ] = new taxonClass( row, taxaMeta[ name ] );

        }

    }


}

export { Taxa, TAXA_LIST_COLS };