import { Config } from "./config.js";
import { Taxon } from "./taxon.js";
import { ErrorLog } from "./errorlog.js";
import { HTML } from "./html.js";
import { CSV } from "./csv.js";
import { RarePlants } from "./rareplants.js";

const FLOWER_COLOR_NAMES = [ "white", "red", "pink", "orange", "yellow", "blue" ];

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

class FlowerColor {

    #color;
    #taxa = [];

    constructor( color ) {
        this.#color = color;
    }

    addTaxon( taxon ) {
        this.#taxa.push( taxon );
    }

    getColorName( uc = false ) {
        return uc ? ( this.#color[ 0 ].toUpperCase() + this.#color.substring( 1 ) ) : this.#color;
    }

    getFileName() {
        return "list_fc_" + this.#color + ".html";
    }

    getTaxa() {
        return this.#taxa;
    }

}

class Taxa {

    static #taxa = {};
    static #flower_colors = {};
    static #sortedTaxa;

    static {
        for ( const color of FLOWER_COLOR_NAMES ) {
            this.#flower_colors[ color ] = new FlowerColor( color );
        }
    }

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

    static getFlowerColor( name ) {
        return this.#flower_colors[ name ];
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
            const taxon = new taxonClass( row, taxaMeta[ name ] );
            this.#taxa[ name ] = taxon;
            const colors = taxon.getFlowerColors();
            if ( colors ) {
                for ( const colorName of colors ) {
                    const color = this.#flower_colors[ colorName ];
                    if ( !color ) {
                        throw new Error( "flower color \"" + colorName + "\" not found" );
                    }
                    color.addTaxon( taxon );
                }
            }

        }

    }


}

export { FLOWER_COLOR_NAMES, Taxa, TAXA_LIST_COLS };