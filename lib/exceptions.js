import { Config } from "./config.js";
import { Files } from "./files.js";

class Exceptions {

    #exceptions = {};

    constructor( dir ) {

        function readConfig( fileName ) {
            return JSON.parse( Files.read( fileName ) );
        }

        // Read default configuration.
        this.#exceptions = readConfig( Config.getPackageDir() + "/data/exceptions.json" );

        // Add/overwrite with local configuration.
        const localExceptions = readConfig( dir + "/exceptions.json" );
        for ( const [ k, v ] of Object.entries( localExceptions ) ) {
            this.#exceptions[ k ] = v;
            // Tag as a local exception so we can distinguish between global and local.
            v.local = true;
        }

    }

    getExceptions() {
        return Object.entries( this.#exceptions );
    }

    getValue( name, cat, subcat, defaultValue ) {
        const taxonData = this.#exceptions[ name ];
        if ( taxonData ) {
            const catData = taxonData[ cat ];
            if ( catData ) {
                const val = catData[ subcat ];
                return ( val === undefined ) ? defaultValue : val;
            }
        }
        return defaultValue;
    }

    hasException( name, cat, subcat ) {
        const taxonData = this.#exceptions[ name ];
        if ( taxonData ) {
            const catData = taxonData[ cat ];
            if ( catData ) {
                return catData[ subcat ] !== undefined;
            }
        }
        return false;
    }

}

export { Exceptions };