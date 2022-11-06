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

    static load( options ) {

        const defaultDataDir = Config.getPackageDir() + "/data";
        const taxaDir = options.datadir;

        console.log( "loading data" );

        Exceptions.init( taxaDir );
        Families.init( defaultDataDir );
        Genera.init( defaultDataDir );
        Taxa.init( taxaDir );

    }

}

export { DataLoader };