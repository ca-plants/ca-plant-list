import { ErrorLog } from "./errorlog.js";

class GenericTaxaLoader {

    #options;
    #errorLog;
    #taxa;

    constructor( options ) {
        this.#options = options;
        this.#errorLog = new ErrorLog( options.outputdir + "/errors.tsv" );
    }

    getErrorLog() {
        return this.#errorLog;
    }

    getOptions() {
        return this.#options;
    }

    getTaxa() {
        return this.#taxa;
    }

    async load() {
        this.#taxa = await this.loadTaxa();
    }

    async loadTaxa() {
        throw new Error( "must be implemented by subclass" );
    }

    writeErrorLog() {
        this.#errorLog.write();
    }

}

export { GenericTaxaLoader };