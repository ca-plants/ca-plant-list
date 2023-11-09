import * as fs from "node:fs";

class ErrorLog {

    #fileName;
    #echo;
    #errors = [];

    constructor( fileName, echo = false ) {
        this.#fileName = fileName;
        this.#echo = echo;
    }

    log( ...args ) {
        if ( this.#echo ) {
            console.log( args.join() );
        }
        this.#errors.push( args.join( "\t" ) );
    }

    write() {
        fs.writeFileSync( this.#fileName, this.#errors.join( "\n" ) );
    }

}

export { ErrorLog };