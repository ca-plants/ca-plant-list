import { CommandProcessor } from "./commandprocessor.js";
import { Files } from "./files.js";
import { TaxaProcessor } from "./taxaprocessor.js";

class CommandAndTaxaProcessor extends CommandProcessor {

    #taxaProcessor;

    constructor( commandName, commandDesc, optionDefs = [], optionHelp = [], commandHelp = [], taxaLoaderClass ) {
        super( commandName, commandDesc, optionDefs, optionHelp, commandHelp );
        this.#taxaProcessor = new TaxaProcessor( this.getOptions(), taxaLoaderClass );
    }

    async process( commandRunner ) {
        if ( this.helpShown() ) {
            return;
        }
        Files.rmDir( this.getOptions().outputdir );

        await this.#taxaProcessor.process( commandRunner );
    }

}

export { CommandAndTaxaProcessor };