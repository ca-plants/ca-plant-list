import { Taxa } from "./taxa.js";
import { Genera } from "./genera.js";
import { Families } from "./families.js";
import { Config } from "./config.js";
import { Exceptions } from "./exceptions.js";


class DataLoader {

    static load( taxaDir ) {

        const defaultDataDir = Config.getPackageDir() + "/data";

        console.log( "loading data" );

        Exceptions.init( taxaDir );
        Families.init( defaultDataDir );
        Genera.init( defaultDataDir );
        Taxa.init( taxaDir );

    }

}

export { DataLoader };