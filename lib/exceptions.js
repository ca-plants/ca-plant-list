import { Files } from "./files.js";

class Exceptions {

    static #exceptions = {};

    static getExceptions() {
        return Object.entries( this.#exceptions );
    }

    static getValue( name, cat, subcat, defaultValue ) {
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

    static hasException( name, cat, subcat ) {
        const taxonData = this.#exceptions[ name ];
        if ( taxonData ) {
            const catData = taxonData[ cat ];
            if ( catData ) {
                return catData[ subcat ] !== undefined;
            }
        }
        return false;
    }

    static init( dir ) {
        try {
            this.#exceptions = JSON.parse( Files.read( dir + "/exceptions.json" ) );
        } catch ( e ) {
            console.log( e );
        }
    }

}

export { Exceptions };