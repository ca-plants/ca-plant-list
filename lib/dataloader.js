import { Taxa } from "./taxa.js";
import { Genera } from "./genera.js";
import { Families } from "./families.js";
import { Config } from "./config.js";
import { Exceptions } from "./exceptions.js";

const OPTION_DEFS = [
    { name: "datadir", type: String, defaultValue: "./data" },
];

class DataLoader {

    static getOptionDefs() {
        return OPTION_DEFS;
    }

    static init( taxaDir ) {

        const defaultDataDir = Config.getPackageDir() + "/data";

        Exceptions.init( taxaDir );
        Families.init( defaultDataDir );
        Genera.init( defaultDataDir );
    }

    static load( options ) {

        const taxaDir = options.datadir;

        console.log( "loading data" );

        this.init( taxaDir );
        Taxa.init( taxaDir );

    }

}

export { DataLoader };