import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

const OPTION_DEFS = [
    { name: "datadir", type: String, defaultValue: "./data" },
    { name: "help", type: Boolean },
    { name: "outputdir", type: String, defaultValue: "./output" },
    { name: "show-flower-errors", type: Boolean },
];

const OPTION_HELP = [
    {
        name: "datadir",
        type: String,
        typeLabel: "{underline path}",
        description: "The directory in which the data files for the local plant list are located. Defaults to {bold ./data}."

    },
    {
        name: "outputdir",
        type: String,
        typeLabel: "{underline path}",
        description: "The directory in which the output files should be written. Any files or subdirectories originally" +
            " in this directory will be deleted. Defaults to {bold ./output}."

    },
    {
        name: "show-flower-errors",
        type: Boolean,
        description: "Include flower color and flowering time errors in errors.tsv."
    },
    {
        name: "help",
        type: Boolean,
        description: "Print this usage guide."
    },
];

class CommandProcessor {

    #commandName;
    #commandDesc;

    #optionHelp;
    #commandHelp;

    #options;

    /**
     * @param {String} commandName 
     * @param {String} commandDesc 
     * @param {*} optionDefs An array of command line options to be added to the standard options.
     * @param {*} optionHelp An array of help descriptions to be added to the standard options in the first section.
     * @param {*} commandHelp An array of help sections to be appended to the first option section in the help display.
     */
    constructor( commandName, commandDesc, optionDefs = [], optionHelp = [], commandHelp = [] ) {

        this.#commandName = commandName;
        this.#commandDesc = commandDesc;

        this.#optionHelp = optionHelp;
        this.#commandHelp = commandHelp;

        this.#options = commandLineArgs( OPTION_DEFS.concat( optionDefs ) );

        if ( this.shouldShowHelp() ) {
            this.showHelp();
            return;
        }

    }

    getOptions() {
        return this.#options;
    }

    shouldShowHelp() {
        return this.#options.help;
    }

    showHelp() {

        const mainOptions = OPTION_HELP.concat( this.#optionHelp );
        mainOptions.sort( ( a, b ) => a.name.localeCompare( b.name ) );

        const help = [
            {
                header: this.#commandName,
                content: this.#commandDesc
            },
            {
                header: "Options",
                optionList: mainOptions
            }
        ];
        console.log( commandLineUsage( help.concat( this.#commandHelp ) ) );
    }

}

export { CommandProcessor };