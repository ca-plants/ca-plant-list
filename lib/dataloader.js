import { CSV } from "./csv.js";
import { Taxa } from "./taxa.js";
import { Files } from "./files.js";
import { ErrorLog } from "./errorlog.js";

class DataLoader {

    static #errorLog = new ErrorLog();

    static getErrorLog() {
        return DataLoader.#errorLog;
    }

    static load( options ) {

        function getIncludeList( dataDir ) {
            // Read inclusion list.
            const includeFileName = "taxa_include.csv";
            const includeFilePath = dataDir + "/" + includeFileName;
            if ( !Files.exists( includeFilePath ) ) {
                console.log( includeFilePath + " not found; loading all taxa" );
                return true;
            }
            const includeCSV = CSV.parseFile( dataDir, includeFileName );
            const include = {};
            for ( const row of includeCSV ) {
                include[ row[ "taxon_name" ] ] = row;
            }
            return include;
        }

        const showFlowerErrors = options[ "show-flower-errors" ];

        console.log( "loading data" );

        return new Taxa( getIncludeList( options.datadir ), this.getErrorLog(), showFlowerErrors );

    }

    static writeErrorLog() {
        DataLoader.#errorLog.write();
    }

}

export { DataLoader };