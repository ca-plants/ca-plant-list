import { TaxaLoader } from "./taxaloader.js";

class TaxaProcessor {

    #options;
    #taxaLoaderClass;
    #taxaLoader;

    constructor( options, taxaLoaderClass = TaxaLoader ) {
        this.#options = options;
        this.#taxaLoaderClass = taxaLoaderClass;
    }

    async customProcess() {
        throw new Error( "must be implemented by subclass" );
    }

    getOptions() {
        return this.#options;
    }

    getTaxa() {
        return this.#taxaLoader.getTaxa();
    }

    async process() {
        console.log( "loading data" );
        this.#taxaLoader = new this.#taxaLoaderClass( this.#options );
        await this.customProcess();
        this.#taxaLoader.writeErrorLog();
    }

}

export { TaxaProcessor };