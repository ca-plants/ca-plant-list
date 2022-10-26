import { Taxa } from "./taxa.js";
import { Genera } from "./genera.js";
import { Families } from "./families.js";

class DataLoader {

    static load( taxaDir, dataDir ) {

        console.log( "loading data" );

        Families.init( dataDir );
        Genera.init( dataDir );
        Taxa.init( taxaDir );

    }

}

export { DataLoader };