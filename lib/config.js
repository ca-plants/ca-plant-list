import * as path from "node:path";
import * as url from "node:url";
import * as fs from "node:fs";

class Config {

    static #config = {};
    static #packageDir = path.dirname( path.dirname( url.fileURLToPath( import.meta.url ) ) );

    static getConfigValue( prefix, name, dflt ) {
        const obj = this.#config[ prefix ];
        if ( obj ) {
            if ( Object.hasOwn( obj, name ) ) {
                return obj[ name ];
            }
        }
        return dflt;
    }

    static getLabel( name, dflt ) {
        return this.getConfigValue( "labels", name, dflt );
    }

    static getPackageDir() {
        return this.#packageDir;
    }

    static init( dir ) {
        try {
            this.#config = JSON.parse( fs.readFileSync( dir + "/config.json" ) );
        } catch ( e ) {
            console.log( e );
        }
    }

}

export { Config };