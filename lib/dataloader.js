import { CSV } from "./csv.js";
import { Taxa } from "./taxa.js";
import { Files } from "./files.js";

const OPTION_DEFS = [
    { name: "datadir", type: String },
];

class DataLoader {

    static getOptionDefs() {
        return OPTION_DEFS;
    }

    static load( dataDir ) {

        function getIncludeList( dataDir ) {
            // Read inclusion list.
            const includeFileName = "taxa_include.csv";
            if ( !Files.exists( dataDir + "/" + includeFileName ) ) {
                console.log( includeFileName + " not found; loading all taxa" );
                return true;
            }
            const includeCSV = CSV.parseFile( dataDir, includeFileName );
            const include = {};
            for ( const row of includeCSV ) {
                include[ row[ "taxon_name" ] ] = row;
            }
            return include;
        }

        console.log( "loading data" );

        return new Taxa( getIncludeList( dataDir ) );

    }

}

export { DataLoader };