import { CSV } from "./csv.js";
import { Taxa } from "./taxa.js";
import { Families } from "./families.js";
import { Exceptions } from "./exceptions.js";

const OPTION_DEFS = [
    { name: "datadir", type: String, defaultValue: "./data" },
];

class DataLoader {

    static getOptionDefs() {
        return OPTION_DEFS;
    }

    static init( taxaDir ) {
        Exceptions.init( taxaDir );
        Families.init();
    }

    static load( options ) {

        const taxaDir = options.datadir;

        console.log( "loading data" );

        this.init( taxaDir );

        // Read inclusion list.
        const includeCSV = CSV.parseFile( taxaDir, "taxa_include.csv" );
        const include = [];
        for ( const row of includeCSV ) {
            include.push( row[ "taxon_name" ] );
        }

        Taxa.init( include );

    }

}

export { DataLoader };