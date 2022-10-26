import * as fs from "node:fs";

class ErrorLog {

    static #errors = [];

    static log( ...args ) {
        this.#errors.push( args.join( "\t" ) );
    }

    static write( fileName ) {
        fs.writeFileSync( fileName, this.#errors.join( "\n" ) );
    }

}

export { ErrorLog };