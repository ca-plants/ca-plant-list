import { CSV } from "./csv.js";
import { Files } from "./files.js";
import { GenericTaxaLoader } from "./generictaxaloader.js";
import { Taxa } from "./taxa.js";

class TaxaLoader extends GenericTaxaLoader {

    constructor( options ) {
        super( options );
    }

    async loadTaxa() {
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

        const options = this.getOptions();
        return new Taxa( getIncludeList( options.datadir ), this.getErrorLog(), options[ "show-flower-errors" ] );
    }

}

export { TaxaLoader };