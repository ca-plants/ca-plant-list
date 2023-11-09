import { CSV } from "./csv.js";
import { ErrorLog } from "./errorlog.js";
import { Files } from "./files.js";
import { Taxa } from "./taxa.js";

class TaxaLoader {

    #errorLog;
    #taxa;

    constructor( options ) {

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

        this.#errorLog = new ErrorLog( options.outputdir + "/errors.tsv" );

        this.#taxa = new Taxa( getIncludeList( options.datadir ), this.getErrorLog(), options[ "show-flower-errors" ] );

    }

    getErrorLog() {
        return this.#errorLog;
    }

    getTaxa() {
        return this.#taxa;
    }

    writeErrorLog() {
        this.#errorLog.write();
    }

}

export { TaxaLoader };