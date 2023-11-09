import * as fs from "node:fs";

class ErrorLog {

    #fileName;
    #errors = [];

    constructor( fileName ) {
        this.#fileName = fileName;
    }

    log( ...args ) {
        this.#errors.push( args.join( "\t" ) );
    }

    write() {
        fs.writeFileSync( this.#fileName, this.#errors.join( "\n" ) );
    }

}

export { ErrorLog };