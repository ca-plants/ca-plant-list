import * as path from "node:path";
import * as url from "node:url";
import { Files } from "./files.js";

class Config {

    static #packageDir = path.dirname( path.dirname( url.fileURLToPath( import.meta.url ) ) );

    #config = {};

    constructor( dataDir ) {
        this.#config = JSON.parse( Files.read( dataDir + "/config.json" ) );
    }

    getConfigValue( prefix, name, subcat, dflt ) {
        const obj = this.#config[ prefix ];
        if ( obj ) {
            if ( Object.hasOwn( obj, name ) ) {
                const nameObj = obj[ name ];
                if ( nameObj === undefined ) {
                    return dflt;
                }
                if ( subcat === undefined ) {
                    return nameObj;
                }
                if ( Object.hasOwn( nameObj, subcat ) ) {
                    return nameObj[ subcat ];
                }
            }
        }
        return dflt;
    }

    getCountyCodes() {
        return this.#config[ "counties" ];
    }

    getLabel( name, dflt ) {
        return this.getConfigValue( "labels", name, undefined, dflt );
    }

    static getPackageDir() {
        return this.#packageDir;
    }

}

export { Config };