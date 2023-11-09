import { CommandProcessor } from "./commandprocessor.js";
import { TaxaProcessor } from "./taxaprocessor.js";

class GenericTaxaProcessor extends TaxaProcessor {

    #fnCustomProcess;

    constructor( fnCustomProcess, options, taxaLoaderClass ) {
        super( options, taxaLoaderClass );
        this.#fnCustomProcess = fnCustomProcess;
    }

    async customProcess() {
        await this.#fnCustomProcess( this );
    }

}

class CommandAndTaxaProcessor extends CommandProcessor {

    #taxaProcessor;

    constructor( commandName, commandDesc, fnCustomProcess, optionDefs = [], optionHelp = [], commandHelp = [], taxaLoaderClass ) {
        super( commandName, commandDesc, optionDefs, optionHelp, commandHelp );
        this.#taxaProcessor = new GenericTaxaProcessor( fnCustomProcess, this.getOptions(), taxaLoaderClass );
    }

    async process() {
        if ( this.helpShown() ) {
            return;
        }
        await this.#taxaProcessor.process();
    }

}

export { CommandAndTaxaProcessor };