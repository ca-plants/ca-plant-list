import { CommandProcessor } from "./commandprocessor.js";
import { Files } from "./files.js";
import { TaxaProcessor } from "./taxaprocessor.js";

class CommandAndTaxaProcessor extends CommandProcessor {
    #taxaProcessor;

    /**
     *
     * @param {string} commandName
     * @param {string} commandDesc
     * @param {import("command-line-args").OptionDefinition[]} [optionDefs=[]]
     * @param {import("command-line-args").OptionDefinition[]} [optionHelp=[]]
     * @param {import("command-line-args").OptionDefinition[]} [commandHelp=[]]
     * @param {TaxaLoader} [taxaLoaderClass]
     */
    constructor(
        commandName,
        commandDesc,
        optionDefs = [],
        optionHelp = [],
        commandHelp = [],
        taxaLoaderClass
    ) {
        super(commandName, commandDesc, optionDefs, optionHelp, commandHelp);
        this.#taxaProcessor = new TaxaProcessor(
            this.getOptions(),
            taxaLoaderClass
        );
    }

    /**
     * @param {function(TaxaProcessor):void} commandRunner
     */
    async process(commandRunner) {
        if (this.helpShown()) {
            return;
        }
        Files.rmDir(this.getOptions().outputdir);

        await this.#taxaProcessor.process(commandRunner);
    }
}

export { CommandAndTaxaProcessor };
