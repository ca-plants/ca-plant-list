import { TaxaLoader } from "./taxaloader.js";

class TaxaProcessor {
    #options;
    #taxaLoaderClass;
    /** @type {TaxaLoader|undefined} */
    #taxaLoader;

    /**
     * @param {import("command-line-args").CommandLineOptions} options
     */
    constructor(options, taxaLoaderClass = TaxaLoader) {
        this.#options = options;
        this.#taxaLoaderClass = taxaLoaderClass;
    }

    getErrorLog() {
        return this.#taxaLoader.getErrorLog();
    }

    getOptions() {
        return this.#options;
    }

    getTaxa() {
        return this.#taxaLoader.getTaxa();
    }

    /**
     * @param {function(TaxaProcessor):void} commandRunner
     */
    async process(commandRunner) {
        console.log("loading data");
        this.#taxaLoader = new this.#taxaLoaderClass(this.#options);
        await this.#taxaLoader.load();
        await commandRunner(this);
        this.#taxaLoader.writeErrorLog();
    }
}

export { TaxaProcessor };
