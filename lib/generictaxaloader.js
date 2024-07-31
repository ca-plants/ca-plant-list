import { ErrorLog } from "./errorlog.js";

class GenericTaxaLoader {
    #options;
    #errorLog;
    /** @type {import("./index.js").Taxa|undefined}*/
    #taxa;

    /**
     * @param {CommandLineOptions} options
     */
    constructor(options) {
        this.#options = options;
        this.#errorLog = new ErrorLog(options.outputdir + "/errors.tsv");
    }

    /**
     * @returns {ErrorLog}
     */
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

    /**
     * @return {Promise<import("./index.js").Taxa>}
     */
    async loadTaxa() {
        throw new Error("must be implemented by subclass");
    }

    writeErrorLog() {
        this.#errorLog.write();
    }
}

export { GenericTaxaLoader };
