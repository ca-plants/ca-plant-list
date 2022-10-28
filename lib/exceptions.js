import * as fs from "node:fs";

class Exceptions {

    static #exceptions = {};

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

    static getValue( name, cat, subcat ) {
        const taxonData = this.#exceptions[ name ];
        if ( taxonData ) {
            const catData = taxonData[ cat ];
            if ( catData ) {
                return catData[ subcat ];
            }
        }
    }

    static init( dir ) {
        try {
            this.#exceptions = JSON.parse( fs.readFileSync( dir + "/exceptions.json" ) );
        } catch ( e ) {
            console.log( e );
        }
    }

}

export { Exceptions };