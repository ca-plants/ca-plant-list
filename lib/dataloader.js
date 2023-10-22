import { CSV } from "./csv.js";
import { Taxa } from "./taxa.js";
import { Families } from "./families.js";
import { Exceptions } from "./exceptions.js";
import { Files } from "./files.js";

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

        function getIncludeList() {
            // Read inclusion list.
            const includeFileName = "taxa_include.csv";
            if ( !Files.exists( taxaDir + "/" + includeFileName ) ) {
                console.log( includeFileName + " not found; loading all taxa" );
                return true;
            }
            const includeCSV = CSV.parseFile( taxaDir, includeFileName );
            const include = {};
            for ( const row of includeCSV ) {
                include[ row[ "taxon_name" ] ] = row;
            }
            return include;
        }

        const taxaDir = options.datadir;

        console.log( "loading data" );

        this.init( taxaDir );

        return new Taxa( getIncludeList() );

    }

}

export { DataLoader };